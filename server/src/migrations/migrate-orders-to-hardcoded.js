import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js"; // ✅ Import Category model

dotenv.config();

const migrateOrdersToHardcoded = async () => {
  try {
    console.log("🚀 Starting orders migration...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_CONN);
    console.log("✅ Connected to MongoDB");

    // Get all orders
    const orders = await Order.find({}).lean();
    console.log(`📦 Found ${orders.length} orders to migrate`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const order of orders) {
      try {
        // Skip if already migrated (check if items have product_name)
        if (order.items?.[0]?.product_name) {
          console.log(`⏭️  Order ${order.order_number} already migrated, skipping...`);
          skippedCount++;
          continue;
        }

        console.log(`\n🔄 Migrating order: ${order.order_number}`);

        const migratedItems = [];

        // Process each item
        for (const item of order.items || []) {
          // Get product data with populated category
          const product = await Product.findById(item.product_id).lean();

          if (!product) {
            console.warn(`⚠️  Product ${item.product_id} not found for order ${order.order_number}`);
            
            // Create item with minimal data if product not found
            migratedItems.push({
              product_id: item.product_id,
              product_name: "Sản phẩm không tồn tại",
              product_slug: "",
              product_image: "",
              product_description: "",
              category_name: "",
              category_id: null,
              quantity: item.quantity || 1,
              price: item.price || 0,
              sale_price: item.sale_price || 0,
              original_price: item.price || 0,
              total: item.total || 0,
              sku: "",
              weight: 0,
              unit: "sản phẩm",
              variant: {},
              discount_percent: 0,
              discount_amount: 0,
              was_on_sale: false,
              was_featured: false,
              hometown_origin: {},
              product_deleted: true,
              product_exists: false,
              created_at: item.created_at || order.created_at || new Date(),
            });
            continue;
          }

          // ✅ Get category separately
          let categoryName = "";
          let categoryId = null;
          
          if (product.category_id) {
            const category = await Category.findById(product.category_id).lean();
            if (category) {
              categoryName = category.name;
              categoryId = category._id;
            }
          }

          // Get primary image
          const primaryImage = product.images?.find((img) => img.is_primary);
          const productImage = primaryImage?.image_url || product.images?.[0]?.image_url || "";

          // Calculate prices
          const salePrice = product.sale_price || 0;
          const originalPrice = item.price || product.price || 0;
          const finalPrice = item.price || (salePrice > 0 && salePrice < product.price ? salePrice : product.price);
          const itemTotal = item.total || (finalPrice * item.quantity);
          const discountAmount = originalPrice - finalPrice;
          const discountPercent = discountAmount > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

          // Create migrated item with hardcoded data
          migratedItems.push({
            product_id: product._id,
            // Hardcoded product info
            product_name: product.name || "Sản phẩm",
            product_slug: product.slug || "",
            product_image: productImage,
            product_description: product.description || product.short_description || "",
            category_name: categoryName,
            category_id: categoryId,
            // Pricing
            quantity: item.quantity || 1,
            price: finalPrice,
            sale_price: salePrice,
            original_price: originalPrice,
            total: itemTotal,
            // Additional info
            sku: product.sku || "",
            weight: product.weight || 0,
            unit: product.unit || "sản phẩm",
            // Variant
            variant: item.variant || {},
            // Discount
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            // Product status
            was_on_sale: salePrice > 0 && salePrice < product.price,
            was_featured: product.featured || false,
            // Hometown
            hometown_origin: product.hometown_origin || {},
            // Tracking
            product_deleted: false,
            product_exists: true,
            created_at: item.created_at || order.created_at || new Date(),
          });

          console.log(`  ✓ Migrated item: ${product.name}`);
        }

        // Update order with migrated items
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              items: migratedItems,
              payment_status: order.payment_status || "pending",
            },
          },
          { new: true }
        );

        console.log(`✅ Successfully migrated order: ${order.order_number}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error migrating order ${order.order_number}:`, error.message);
        errorCount++;
        errors.push({
          order_number: order.order_number,
          error: error.message,
        });
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log(`✅ Successfully migrated: ${successCount} orders`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} orders`);
    console.log(`❌ Failed: ${errorCount} orders`);
    console.log(`📦 Total orders: ${orders.length}`);
    console.log("=".repeat(50));

    if (errors.length > 0) {
      console.log("\n⚠️  Errors:");
      errors.forEach((err, index) => {
        if (index < 10) { // Show only first 10 errors
          console.log(`  - ${err.order_number}: ${err.error}`);
        }
      });
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }

    console.log("\n✨ Migration completed!");
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run migration
migrateOrdersToHardcoded();