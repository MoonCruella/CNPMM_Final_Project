import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/order.model.js";

dotenv.config();

const recalculateAllOrdersSubtotal = async () => {
  try {
    console.log("🚀 Starting recalculate all orders subtotal...");

    await mongoose.connect(process.env.MONGODB_CONN);
    console.log("✅ Connected to MongoDB");

    // Get ALL orders
    const orders = await Order.find({}).lean();
    console.log(`📦 Found ${orders.length} orders to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        // Calculate subtotal from items
        let calculatedSubtotal = 0;

        if (order.items && order.items.length > 0) {
          calculatedSubtotal = order.items.reduce((sum, item) => {
            const itemTotal = item.total || (item.price * item.quantity);
            return sum + itemTotal;
          }, 0);
        }

        // Fallback calculation if items total is 0
        if (calculatedSubtotal === 0 && order.total_amount) {
          const shippingFee = order.shipping_fee || 0;
          const freeship = order.freeship_value || 0;
          const discount = order.discount_value || 0;
          
          calculatedSubtotal = order.total_amount - shippingFee + freeship + discount;
        }

        // Only update if subtotal is different
        if (order.subtotal !== calculatedSubtotal) {
          await Order.findByIdAndUpdate(
            order._id,
            { $set: { subtotal: calculatedSubtotal } }
          );
          
          console.log(`✅ ${order.order_number}: ${order.subtotal || 0} → ${calculatedSubtotal}`);
          successCount++;
        } else {
          console.log(`⏭️  ${order.order_number}: Already correct (${calculatedSubtotal})`);
        }
      } catch (error) {
        console.error(`❌ Error: ${order.order_number}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log(`✅ Updated: ${successCount} orders`);
    console.log(`❌ Failed: ${errorCount} orders`);
    console.log(`📦 Total: ${orders.length} orders`);
    console.log("=".repeat(60));

    console.log("\n✨ Completed!");
  } catch (error) {
    console.error("💥 Failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected");
    process.exit(0);
  }
};

recalculateAllOrdersSubtotal();