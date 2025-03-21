import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DashSideBar from "../components/DashSideBar";
import DashProfile from "../components/DashProfile";
import DashUserProfiles from "../components/DashUserProfiles";
import DashDistrict from "../components/DashDistrict";
import DashWasteReuest from "../components/DashWasteRequest";
import DashWasteRequest from "../components/DashWasteRequest";
import DashWasteDrivers from "../components/DashWasteDrivers";
import DashWasteCategory from "../components/DashWasteCategory";
import DashAdminWasteRequests from "../components/DashAdminWasteRequests";
import DashDriverRequests from "../components/DashDriverRequests";
import DashAdminPayments from "../components/DashAdminPayments";
import DashMyPayments from "../components/DashMyPayments";
import DashWasteDashBoard from "../components/DashWasteDashBoard";
export default function Dashboard() {
  const location = useLocation();
  const [tab, setTab] = useState("");
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* <DashSideBar /> */}
      <div className=" md:w-56">
        <DashSideBar />
      </div>
      {/* <DashProfile /> */}
      {tab === "profile" && <DashProfile />}
      {/** <DashUserProfiles/> */}
      {tab === "users" && <DashUserProfiles/>}
      {/** <DashDistrict/> */}
      {tab === "districts" && <DashDistrict/>}
      {/** <DashWasteCategory/> */}
      {tab === "waste-categories" && <DashWasteCategory/>}
      {/** <DashWasteRequest/> */}
      {tab === "waste-requests" && <DashWasteRequest/>}
      {/**<WasteDrivers/> */}
      {tab === "waste-drivers" && <DashWasteDrivers/>}
      {/** <DashAdminWasteRequest/> */}
      {tab === "admin-waste-requests" && <DashAdminWasteRequests/>}
      {/** <DashDriverRequests/> */}
      {tab === "driver-requests" && <DashDriverRequests/>}
      {/** <DashAdminPayments/> */}
      {tab === "admin-payments" && <DashAdminPayments/>}
      {/** <DashUserPayments/> */}
      {tab === "user-payments" && <DashMyPayments/>}
      {/** <DashboardWasteManagement/> */}
      {tab === "waste-management-dashboard" && <DashWasteDashBoard/>}

    </div>
  );
}
