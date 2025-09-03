import React from "react";
import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";
const Footer = () => {
  return (
    <footer className=" bg-[#051b0d] text-white pt-24 pb-12">
      {/* Footer Widgets */}
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-8">
        {/* About Widget */}
        <div className="xl:col-span-3 md:col-span-6 order-1">
          <div className="mb-10" data-aos="fade-up" data-aos-duration="800">
            <img src={assets.logo} alt="logo" className="mb-6 w-12 h-12" />
            <p className="text-gray-300 mb-4">
              Khám phá hương vị Phú Yên cùng PySpecials – từ nông sản tươi ngon,
              hải sản phong phú đến những món quà đặc sản truyền thống.
            </p>
          </div>
        </div>

        {/* Navigation & Contact */}
        <div className="xl:col-span-6 order-3 xl:order-2 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          {/* Our Links */}
          <div data-aos="fade-up" data-aos-duration="1000">
            <h4 className="text-xl font-bold mb-4">Link của chúng tôi</h4>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="hover:text-green-500">
                  About us
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-green-500">
                  Contact us
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-green-500">
                  Products
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-green-500">
                  Services
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-green-500">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div data-aos="fade-up" data-aos-duration="1200">
            <h4 className="text-xl font-bold mb-4">Thông tin liên hệ</h4>
            <div className="space-y-4">
              <div className="flex items-start ">
                <div>
                  <span className="font-semibold">Địa chỉ</span>
                  <p>01 Võ Văn Ngân, Tp. Thủ Đức, Tp. Hồ Chí Minh</p>
                </div>
              </div>
              <div className="flex items-start ">
                <div>
                  <span className="font-semibold">Email</span>
                  <p>
                    <a
                      href="mailto:nhunguyetpy206@gmail.com"
                      className="hover:text-green-500"
                    >
                      nhunguyetpy206@gmail.com
                    </a>
                  </p>
                  <p className="mt-1">
                    <a
                      href="mailto:hoapham236@gmail.com"
                      className="hover:text-green-500"
                    >
                      hoapham236@gmail.com
                    </a>
                  </p>
                  <p className="mt-1">
                    <a
                      href="mailto:ttnghia204@gmail.com"
                      className="hover:text-green-500"
                    >
                      ttnghia204@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start ">
                <div>
                  <span className="font-semibold">Số điện thoại</span>
                  <p>
                    <a href="tel:+12376599854" className="hover:text-green-500">
                      0392796201
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh toán */}
        <div className="xl:col-span-3 md:col-span-6 order-2 xl:order-3">
          <div data-aos="fade-up" data-aos-duration="1400">
            <h4 className="text-xl font-bold mb-4">Thanh toán</h4>
            <div className="flex items-center gap-4">
              <img
                src={assets.vnpay_icon}
                alt="VNPAY"
                className="h-12 object-contain"
              />
              <img
                src={assets.zalo_pay}
                alt="ZaloPay"
                className="h-12 object-contain"
              />
              <img
                src={assets.cod_icon}
                alt="COD"
                className="h-12 object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 mt-12 pt-6">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row justify-between items-center text-center lg:text-left gap-4">
          <p className="text-gray-400">
            &copy; 2025 All rights reserved by PySpecials
          </p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-green-500">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-green-500">
              Terms & Condition
            </Link>
            <Link to="#" className="hover:text-green-500">
              Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
