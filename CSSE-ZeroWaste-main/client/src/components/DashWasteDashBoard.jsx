import React from "react";
import { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrashAlt } from "react-icons/fa";
import { GiRecycle } from "react-icons/gi";
import { RiGovernmentLine } from "react-icons/ri";
import { useSelector } from "react-redux";
import { MdFactCheck, MdLocalShipping } from "react-icons/md";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function DashAdminWasteRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingRequests, setPendingRequests] = useState(0);
  const [acceptedRequests, setAcceptedRequests] = useState(0);
  const [rejectedRequests, setRejectedRequests] = useState(0);
  const { currentUser } = useSelector((state) => state.user);
  const [totalrequests, setTotalRequests] = useState(0);
  const [wasteStats, setWasteStats] = useState(null);
  const [totalPendingDriverRequests, setTotalPendingDriverRequests] =
    useState(0);
  const [totalAcceptedDriverRequests, setTotalAcceptedDriverRequests] =
    useState(0);
  const [totalRejectedDriverRequests, setTotalRejectedDriverRequests] =
    useState(0);
  const [totalDistricts, setTotalDistricts] = useState(0);
  const [totalActiveDistricts, setTotalActiveDistricts] = useState(0);
  const [totalInactiveDistricts, setTotalInactiveDistricts] = useState(0);
  const [totalCities, setTotalCities] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalActiveCategories, setTotalActiveCategories] = useState(0);
  const [totalInactiveCategories, setTotalInactiveCategories] = useState(0);
  const [totalPendingCollectionRequests, setTotalPendingCollectionRequests] =
    useState(0);
  const [totalAcceptedCollectionRequests, setTotalAcceptedCollectionRequests] =
    useState(0);
  const [totalRejectedCollectionRequests, setTotalRejectedCollectionRequests] =
    useState(0);

  const fetchDistricts = async () => {
    try {
      const res = await fetch("/api/district/get");
      const data = await res.json();
      if (res.ok) {
        setTotalDistricts(data.totalDistricts);
        setTotalActiveDistricts(data.totalActiveDistricts);
        setTotalInactiveDistricts(data.totalInactiveDistricts);
        setTotalCities(data.totalCities);
      } else {
        setError(data.message);
      }
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  const fetchRequest = async () => {
    try {
      const res = await fetch("/api/request/get", {});
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTotalRequests(data.totalWasteRequests);
        setPendingRequests(data.totalPendingRequests);
        setAcceptedRequests(data.totalAcceptedRequests);
        setRejectedRequests(data.totalRejectedRequests);
        setTotalPendingDriverRequests(data.totalPendingRequestsByTruckDrivers);
        setTotalAcceptedDriverRequests(
          data.totalAcceptedRequestsByTruckDrivers
        );
        setTotalRejectedDriverRequests(
          data.totalRejectedRequestsByTruckDrivers
        );
        setTotalPendingCollectionRequests(data.totalCollectionPendingRequests);
        setTotalAcceptedCollectionRequests(
          data.totalCollectionCompletedRequests
        );
        setTotalRejectedCollectionRequests(
          data.totalCollectionRejectedRequests
        );
        // Calculate stats from the fetched data
        const calculatedStats = calculateStats(data.wasteRequests);
        setWasteStats(calculatedStats);
        setLoading(false);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  const fetchWasteCategories = async () => {
    try {
      const res = await fetch("/api/waste-category/get");
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      const data = await res.json();
      setTotalCategories(data.total);
      setTotalActiveCategories(data.active);
      setTotalInactiveCategories(data.inactive);
      setCategories(filteredCategories);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  function calculateStats(wasteRequests) {
    const stats = {
      TotalRequests: wasteRequests.length,
      PendingRequests: 0,
      AcceptedRequests: 0,
      RejectedRequests: 0,
      CompletedFullyRequests: 0,
      TotalWasteQuantity: 0,
      RequestsPerCity: {},
      RequestsPerWasteCategory: {},
      QuantityPerWasteCategory: {},
      QuantityPerCity: {},
    };

    wasteRequests.forEach((request) => {
      stats.TotalWasteQuantity += request.quantity;

      switch (request.requestStatus) {
        case "PENDING":
          stats.PendingRequests++;
          break;
        case "ACCEPTED":
          stats.AcceptedRequests++;
          break;
        case "REJECTED":
          stats.RejectedRequests++;
          break;
      }

      if (
        request.requestStatus === "ACCEPTED" &&
        request.truckDriverStatus === "ACCEPTED" &&
        request.collectionStatus === "COMPLETED" &&
        request.paymentStatus === "COMPLETED"
      ) {
        stats.CompletedFullyRequests++;
      }

      // Handle city data
      stats.RequestsPerCity[request.city] =
        (stats.RequestsPerCity[request.city] || 0) + 1;

      stats.QuantityPerCity[request.city] =
        (stats.QuantityPerCity[request.city] || 0) + request.quantity;

      // Handle waste category data
      const categoryName = request.wasteCategory?.name || "Uncategorized";
      stats.RequestsPerWasteCategory[categoryName] =
        (stats.RequestsPerWasteCategory[categoryName] || 0) + 1;
      stats.QuantityPerWasteCategory[categoryName] =
        (stats.QuantityPerWasteCategory[categoryName] || 0) + request.quantity;
    });

    return stats;
  }

  const prepareChartData = () => {
    if (!wasteStats) return;

    // Waste Distribution Chart
    const wasteDistributionData = {
      labels: ["Pending", "Accepted", "Rejected", "Completed Fully"],
      datasets: [
        {
          label: "Waste Distribution",
          data: [
            wasteStats.PendingRequests,
            wasteStats.AcceptedRequests,
            wasteStats.RejectedRequests,
            wasteStats.CompletedFullyRequests,
          ],
          backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384", "#4BC0C0"],
        },
      ],
    };

    // Waste Distribution Cities
    const wasteDistributionCitiesData = {
      labels: Object.keys(wasteStats.QuantityPerCity),
      datasets: [
        {
          label: "Waste Distribution by Cities",
          data: Object.values(wasteStats.QuantityPerCity),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    };

    // Waste Distribution Categories
    const wasteDistributionCategoriesData = {
      labels: Object.keys(wasteStats.QuantityPerWasteCategory),
      datasets: [
        {
          label: "Waste Distribution by Categories",
          data: Object.values(wasteStats.QuantityPerWasteCategory),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    };

    // Waste Requests by Cities
    const wasteRequestsCitiesData = {
      labels: Object.keys(wasteStats.RequestsPerCity),
      datasets: [
        {
          label: "Number of Requests",
          data: Object.values(wasteStats.RequestsPerCity),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
      ],
    };

    // Waste Requests by Categories
    const wasteRequestsCategoriesData = {
      labels: Object.keys(wasteStats.RequestsPerWasteCategory),
      datasets: [
        {
          label: "Number of Requests",
          data: Object.values(wasteStats.RequestsPerWasteCategory),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };

    return {
      wasteDistributionData,
      wasteDistributionCitiesData,
      wasteDistributionCategoriesData,
      wasteRequestsCitiesData,
      wasteRequestsCategoriesData,
    };
  };

  useEffect(() => {
    fetchRequest();
    fetchDistricts();
    fetchWasteCategories();
  });

  const chartData = prepareChartData();

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      <ToastContainer />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="p-3 md:mx-auto">
            {/* District Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-left text-gray-700 mb-6 dark:text-white uppercase">
                District Summary
              </h3>
              <div className=" flex-wrap flex gap-4 justify-center">
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Total Districts
                      </h3>
                      <p className="text-2xl">{totalDistricts}</p>
                    </div>
                    <RiGovernmentLine className="bg-yellow-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Active Districts
                      </h3>
                      <p className="text-2xl">{totalActiveDistricts}</p>
                    </div>
                    <RiGovernmentLine className="bg-green-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Inactive Districts
                      </h3>
                      <p className="text-2xl">{totalInactiveDistricts}</p>
                    </div>
                    <RiGovernmentLine className="bg-red-500 text-white text-5xl p-3 shadow-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-left text-gray-700 mb-6 dark:text-white uppercase">
                Waste Category Summary
              </h3>
              <div className=" flex-wrap flex gap-4 justify-center">
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Total Categories
                      </h3>
                      <p className="text-2xl">{totalCategories}</p>
                    </div>
                    <GiRecycle className="bg-yellow-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Active Categories
                      </h3>
                      <p className="text-2xl">{totalActiveCategories}</p>
                    </div>
                    <GiRecycle className="bg-green-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Inactive Categories
                      </h3>
                      <p className="text-2xl">{totalInactiveCategories}</p>
                    </div>
                    <GiRecycle className="bg-red-500 text-white text-5xl p-3 shadow-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Waste Request Summary */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-left text-gray-700 mb-6 dark:text-white uppercase">
                Waste Request Summary
              </h3>
              <div className=" flex-wrap flex gap-4 justify-center">
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Total Requests
                      </h3>
                      <p className="text-2xl">{totalrequests}</p>
                    </div>
                    <FaTrashAlt className="bg-gray-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Pending Requests
                      </h3>
                      <p className="text-2xl">{pendingRequests}</p>
                    </div>
                    <FaTrashAlt className="bg-yellow-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Accepted Requests
                      </h3>
                      <p className="text-2xl">{acceptedRequests}</p>
                    </div>
                    <FaTrashAlt className="bg-green-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Rejected Requests
                      </h3>
                      <p className="text-2xl">{rejectedRequests}</p>
                    </div>
                    <FaTrashAlt className="bg-red-500 text-white text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Pending Truck Requests
                      </h3>
                      <p className="text-2xl">{totalPendingDriverRequests}</p>
                    </div>
                    <MdLocalShipping className="bg-yellow-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Accepted Truck Requests
                      </h3>
                      <p className="text-2xl">{totalAcceptedDriverRequests}</p>
                    </div>
                    <MdLocalShipping className="bg-green-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Rejected Truck Requests
                      </h3>
                      <p className="text-2xl">{totalRejectedDriverRequests}</p>
                    </div>
                    <MdLocalShipping className="bg-red-500 text-white text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Pending Collection Requests
                      </h3>
                      <p className="text-2xl">
                        {totalPendingCollectionRequests}
                      </p>
                    </div>
                    <MdFactCheck className="bg-yellow-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Collection Completed Requests
                      </h3>
                      <p className="text-2xl">
                        {totalAcceptedCollectionRequests}
                      </p>
                    </div>
                    <MdFactCheck className="bg-green-500 text-white  text-5xl p-3 shadow-lg" />
                  </div>
                </div>
                <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                  <div className="flex justify-between">
                    <div className="">
                      <h3 className="text-gray-500 text-md uppercase">
                        Collection Rejected Requests
                      </h3>
                      <p className="text-2xl">
                        {totalRejectedCollectionRequests}
                      </p>
                    </div>
                    <MdFactCheck className="bg-red-500 text-white text-5xl p-3 shadow-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-left text-gray-700 mb-6 dark:text-white uppercase">
                Analytics Charts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Waste Distribution Chart*/}
                <div className="flex flex-col p-6 dark:bg-slate-800 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 dark:text-white uppercase">
                    Waste Distribution Chart
                  </h3>
                  <div className="flex justify-center h-[300px]">
                    {chartData && (
                      <Bar data={chartData.wasteDistributionData} />
                    )}
                  </div>
                </div>

                {/* Waste Distribution by cities */}
                <div className="flex flex-col p-6 dark:bg-slate-800 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 dark:text-white uppercase">
                    Waste Distribution Cities (KG)
                  </h3>
                  <div className="flex justify-center h-[300px]">
                    {chartData && (
                      <Bar data={chartData.wasteDistributionCitiesData} />
                    )}
                  </div>
                </div>

                {/* Waste Distribution by Categories */}
                <div className="flex flex-col p-6 dark:bg-slate-800 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 dark:text-white uppercase">
                    Waste Distribution Categories (KG)
                  </h3>
                  <div className="flex justify-center h-[300px]">
                    {chartData && (
                      <Bar data={chartData.wasteDistributionCategoriesData} />
                    )}
                  </div>
                </div>

                {/* Waste Requests by Cities */}
                <div className="flex flex-col p-6 dark:bg-slate-800 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 dark:text-white uppercase">
                    Waste Requests by Cities
                  </h3>
                  <div className="flex justify-center h-[300px]">
                    {chartData && (
                      <Bar data={chartData.wasteRequestsCitiesData} />
                    )}
                  </div>
                </div>

                {/* Waste Requests by Categories */}
                <div className="flex flex-col p-6 dark:bg-slate-800 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 dark:text-white uppercase">
                    Waste Requests by Categories
                  </h3>
                  <div className="flex justify-center h-[300px]">
                    {chartData && (
                      <Bar data={chartData.wasteRequestsCategoriesData} />
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
