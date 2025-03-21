import { Sidebar } from "flowbite-react";
import {
  HiUser,
  HiArrowSmRight,
  HiDocument,
  HiDocumentText,
  HiOutlineUserGroup,
  HiAnnotation,
  HiChartPie,
} from "react-icons/hi";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOutSuccess } from "../redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  FaMapMarkerAlt,
  FaTrashAlt,
  FaTruck,
  FaCreditCard,
} from "react-icons/fa";
import { GiRecycle } from "react-icons/gi";
import { RiGovernmentLine } from "react-icons/ri";
import { MdLocalShipping } from "react-icons/md";
export default function DashSideBar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [tab, setTab] = useState("");
  const { currentUser } = useSelector((state) => state.user);
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);

  const handleSignout = async () => {
    try {
      const res = await fetch("/api/user/signout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signOutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  return (
    <Sidebar className="w-full md:w-56">
      <Sidebar.Items>
        <Sidebar.ItemGroup className="flex flex-col gap-1">
          {currentUser && currentUser.isAdmin && (
            <Link to="/dashboard?tab=waste-management-dashboard">
              <Sidebar.Item
                active={tab === "dash" || !tab}
                icon={HiChartPie}
                labelColor="dark"
                as="div"
              >
                Dashboard
              </Sidebar.Item>
            </Link>
          )}
          <Link to="/dashboard?tab=profile">
            <Sidebar.Item
              active={tab === "profile"}
              icon={HiUser}
              label={
                currentUser.isAdmin
                  ? "Admin"
                  : currentUser.isDriver
                  ? "Driver"
                  : "User"
              }
              labelColor="dark"
              as="div"
            >
              Profile
            </Sidebar.Item>
          </Link>
          {currentUser.isDriver && (
            <Link to="/dashboard?tab=driver-requests">
              <Sidebar.Item
                active={tab === "driver-requests"}
                icon={HiDocumentText}
                as="div"
              >
                Waste Requests
              </Sidebar.Item>
            </Link>
          )}
          {currentUser.isAdmin && (
            <>
              <Link to="/dashboard?tab=users">
                <Sidebar.Item
                  active={tab === "users"}
                  icon={HiOutlineUserGroup}
                  as="div"
                >
                  Users
                </Sidebar.Item>
              </Link>
              <Link to="/dashboard?tab=districts">
                <Sidebar.Item
                  active={tab === "districts"}
                  icon={RiGovernmentLine} // Replace with chosen icon
                  as="div"
                >
                  Districts
                </Sidebar.Item>
              </Link>
              <Link to="/dashboard?tab=waste-categories">
                <Sidebar.Item
                  active={tab === "waste-categories"}
                  icon={GiRecycle} // Replace with chosen icon
                  as="div"
                >
                  Waste Category
                </Sidebar.Item>
              </Link>
              <Link to="/dashboard?tab=waste-requests">
                <Sidebar.Item
                  active={tab === "waste-requests"}
                  icon={FaTrashAlt} // Replace with chosen icon
                  as="div"
                >
                  Waste Request
                </Sidebar.Item>
              </Link>
              <Link to="/dashboard?tab=user-payments">
                <Sidebar.Item
                  active={tab === "user-payments"}
                  icon={FaCreditCard} // Replace with chosen icon
                  as="div"
                >
                  Payments
                </Sidebar.Item>
              </Link>
              <Link to="/dashboard?tab=admin-waste-requests">
                <Sidebar.Item
                  active={tab === "admin-waste-requests"}
                  label={currentUser.isAdmin ? "Admin" : "User"}
                  labelColor="dark"
                  icon={FaTrashAlt} // Replace with chosen icon
                  as="div"
                >
                  Requests
                </Sidebar.Item>
              </Link>
              <Link to="/dashboard?tab=admin-payments">
                <Sidebar.Item
                  active={tab === "admin-payments"}
                  label={currentUser.isAdmin ? "Admin" : "User"}
                  labelColor="dark"
                  icon={FaCreditCard} // or FaMoneyBillAlt
                  as="div"
                >
                  Payments
                </Sidebar.Item>
              </Link>
              <Link to="/dashboard?tab=waste-drivers">
                <Sidebar.Item
                  active={tab === "waste-drivers"}
                  icon={MdLocalShipping} // Replace with chosen icon
                  as="div"
                >
                  Drivers
                </Sidebar.Item>
              </Link>
              <Link to="#">
                <Sidebar.Item
                  active={tab === "comments"}
                  icon={HiAnnotation}
                  as="div"
                >
                  Inquiries
                </Sidebar.Item>
              </Link>
            </>
          )}
          <Sidebar.Item
            icon={HiArrowSmRight}
            className="cursor-pointer"
            onClick={handleSignout}
          >
            Sign Out
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
