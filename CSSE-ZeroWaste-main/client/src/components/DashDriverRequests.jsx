import React from "react";
import { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import {
  Table,
  Button,
  TextInput,
  Badge,
  Modal,
  Spinner,
  Label,
} from "flowbite-react";
import { HiCheckCircle, HiEye, HiOutlineX } from "react-icons/hi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactPaginate from "react-paginate";
import ReactSelect from "react-select";
import {
  FaUsers,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaThumbsUp,
  FaTrashAlt,
  FaUserTie,
} from "react-icons/fa";
import { AiOutlineReload, AiOutlineSearch } from "react-icons/ai";
import { RiGovernmentLine } from "react-icons/ri";
import Select from "react-select";
import { useSelector } from "react-redux";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"; // For Google Maps autocomplete
import { connectStorageEmulator } from "firebase/storage";
import { MdLocalShipping } from "react-icons/md";
import {
  Trash2,
  Weight,
  DollarSign,
  Calendar,
  MapPin,
  Home,
  User,
  Mail,
  Phone,
  Truck,
  CheckCircle,
  XCircle,
  IdCard,
  Star,
} from "lucide-react";
export default function DashDriverRequests() {
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [acceptedRequests, setAcceptedRequests] = useState(0);
  const [rejectedRequests, setRejectedRequests] = useState(0);
  const { currentUser } = useSelector((state) => state.user);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  const [wasteCategories, setWasteCategories] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [value, setValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalrequests, setTotalRequests] = useState(0);
  const [selectCities, setSelectCities] = useState([]);
  const [totalPendingDriverRequests, setTotalPendingDriverRequests] =
    useState(0);
  const [totalAcceptedDriverRequests, setTotalAcceptedDriverRequests] =
    useState(0);
  const [totalRejectedDriverRequests, setTotalRejectedDriverRequests] =
    useState(0);
  const [drivers, setDrivers] = useState([]);
  const handleDistrictChange = (selectedOption) => {
    setSelectedDistrict(selectedOption || ""); // Set the selected district
    setFormData({ ...formData, district: selectedOption?._id || "" }); // Update the form data with the selected district
    const relevantCities = selectedOption?.cities || []; // Extract cities from selected district
    setCities(relevantCities); // Update the cities state
  };
  const fetchDistricts = async () => {
    try {
      const res = await fetch("/api/district/get");
      const data = await res.json();
      if (res.ok) {
        const activeDistricts = data.districts.filter(
          (district) => district.isActive === true
        );
        // Set the state with only the active districts
        setDistricts(activeDistricts);
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
      setLoading(true);
      const res = await fetch(
        `/api/request/getDriverRequest/${currentUser._id}`,
        {}
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const uniqueCities = [
          ...new Set(
            data.wasteRequests.map((wasteRequest) => wasteRequest.city)
          ),
        ];
        setSelectCities(uniqueCities);
        setRequests(data.wasteRequests);
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
      }
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/waste-category/get");
      const data = await res.json();
      if (res.ok) {
        const activeCategories = data.wasteCategories.filter(
          (category) => category.isActive === true
        );
        setCategories(activeCategories);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError(error.message);
    }
  };
  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/waste-truck/get");
      const data = await res.json();
      if (res.ok) {
        const activeDrivers = data.drivers.filter(
          (driver) => driver.isActive === true
        );
        setDrivers(activeDrivers);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchRequest();
    fetchDistricts();
    fetchCategories();
    fetchDrivers();
  }, [search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAdd = () => {
    setAddModal(true);
  };

  const [requestViewModal, setRequestViewModal] = useState(false);
  const [requestData, setRequestData] = useState({});
  const handleViewMore = (request) => {
    setRequestViewModal(true);
    setRequestData(request);
  };

  const mapContainerStyle = {
    height: "400px",
    width: "100%",
  };

  const mapCenter = {
    lat: requestData?.location?.coordinates[1], // latitude
    lng: requestData?.location?.coordinates[0], // longitude
  };

  const [deleteRequest, setDeleteRequest] = useState({});
  const handleDelete = (request) => {
    setDeleteRequest(request);
    setDeleteModal(true);
  };

  const [updateModal, setUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({});
  const handleUpdate = (request) => {
    setUpdateModal(true);
    setUpdateData(request);
  };

  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const handleConfirmation = (request) => {
    setConfirmModal(true);
    setConfirmRequest(request);
  };

  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [assignDriverModal, setAssignDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [assignRequest, setAssignRequest] = useState({});
  // When opening the modal, filter drivers based on request's district and city
  const handleAssignDriverClick = (request) => {
    const filteredDrivers = drivers.filter(
      (driver) => driver.city === request.city
    );
    setAssignRequest(request);
    setFilteredDrivers(filteredDrivers);
    setAssignDriverModal(true); // Open the modal
  };

  const [pageNumber, setPageNumber] = useState(0);
  const requestsPerPage = 5;

  const pageCount = Math.ceil(requests.length / requestsPerPage);

  const handlePageChange = ({ selected }) => {
    setPageNumber(selected);
  };

  const displayRequests = requests
    .slice(pageNumber * requestsPerPage, (pageNumber + 1) * requestsPerPage)
    .map((request) => (
      <Table.Body className="divide-y">
        <Table.Row
          key={request._id}
          className="bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          <Table.Cell>
            {new Date(request?.pickUpDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Table.Cell>
          <Table.Cell>
            {request.paymentStatus === "PENDING" ? (
              <Badge color="warning" className="justify-center">
                <FaExclamationTriangle className="mr-2 w-6 h-10" />
              </Badge>
            ) : request.paymentStatus === "COMPLETED" ? (
              <Badge color="success" className="justify-center">
                <FaCheckCircle className="mr-2 w-6 h-10" />
              </Badge>
            ) : (
              <Badge color="failure" className="justify-center">
                <FaTimesCircle className="mr-2 w-6 h-10" />
              </Badge>
            )}
          </Table.Cell>
          <Table.Cell>
            {request.requestStatus === "PENDING" ? (
              <Badge color="warning" className="justify-center">
                <FaExclamationTriangle className="mr-2 w-6 h-10" />
              </Badge>
            ) : request.requestStatus === "ACCEPTED" ? (
              <Badge color="success" className="justify-center">
                <FaCheckCircle className="mr-2 w-6 h-10" />
              </Badge>
            ) : (
              <Badge color="failure" className="justify-center">
                <FaTimesCircle className="mr-2 w-6 h-10" />
              </Badge>
            )}
          </Table.Cell>
          <Table.Cell>
            {request.truckDriverStatus === "PENDING" ? (
              <Badge color="warning" className="justify-center">
                <FaExclamationTriangle className="mr-2 w-6 h-10" />
              </Badge>
            ) : request.truckDriverStatus === "ACCEPTED" ? (
              <Badge color="success" className="justify-center">
                <FaCheckCircle className="mr-2 w-6 h-10" />
              </Badge>
            ) : (
              <Badge color="failure" className="justify-center">
                <FaTimesCircle className="mr-2 w-6 h-10" />
              </Badge>
            )}
          </Table.Cell>
          <Table.Cell>
            {request.collectionStatus === "PENDING" ? (
              <Badge color="warning" className="justify-center">
                <FaExclamationTriangle className="mr-2 w-6 h-10" />
              </Badge>
            ) : request.collectionStatus === "COMPLETED" ? (
              <Badge color="success" className="justify-center">
                <FaCheckCircle className="mr-2 w-6 h-10" />
              </Badge>
            ) : (
              <Badge color="failure" className="justify-center">
                <FaTimesCircle className="mr-2 w-6 h-10" />
              </Badge>
            )}
          </Table.Cell>
          <Table.Cell>
            <div className="flex justify-center items-center space-x-4">
              <Button
                size="sm"
                color="gray"
                className="flex items-center"
                onClick={() => handleViewMore(request)}
              >
                <HiEye className="mr-2 w-6 h-6" />
                View
              </Button>
              <Button
                color="green"
                type="submit"
                outline
                className="flex items-center"
                disabled={
                  request.truckDriverStatus === "ACCEPTED" ||
                  request.requestStatus === "REJECTED"
                }
                onClick={() => handleUpdate(request)}
              >
                <FaClipboardList className="mr-2 w-6 h-6" />
                Update
              </Button>
              <Button
                color="green"
                type="submit"
                outline
                className="flex items-center hover:bg-green-600 focus:ring-2 focus:ring-green-300 transition-all duration-150 ease-in-out"
                onClick={() => handleConfirmation(request)}
                disabled={
                  request.truckDriverStatus === "PENDING" ||
                  request.requestStatus === "REJECTED" ||
                  request.requestStatus === "PENDING" ||
                  request.collectionStatus === "COMPLETED"
                }
              >
                <HiCheckCircle className="mr-2 w-6 h-6" /> Confirm
              </Button>

              <Button
                size="sm"
                color="failure"
                outline
                className="flex items-center"
                onClick={() => handleDelete(request)}
                disabled={request.requestStatus === "ACCEPTED"}
              >
                <HiOutlineX className="mr-2 w-6 h-6" />
                Delete
              </Button>
            </div>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    ));
  const [isAdding, setIsAdding] = useState(false);
  const handleAddRequest = async () => {
    setIsAdding(true);
    if (
      !formData.district ||
      !formData.city ||
      !formData.address ||
      !formData.pickUpDate ||
      !formData.quantity ||
      !formData.wasteCategory ||
      !location
    ) {
      setIsAdding(false);
      return toast.error("Please fill all the fields and select a location");
    }
    if (parseFloat(formData.quantity) <= 0) {
      setIsAdding(false);
      return toast.error("Quantity must be greater than 0");
    }
    if (parseFloat(formData.estimatedPrice) <= 0) {
      setIsAdding(false);
      return toast.error("Estimated price must be greater than 0");
    }
    try {
      const res = await fetch("/api/request/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          location,
          userId: currentUser._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAdding(false);
        toast.success("Request added successfully");
        setFormData({});
        setLocation(null);
        setAddModal(false);
        fetchRequest();
      } else {
        setIsAdding(false);
        setFormData({});
        setLocation(null);
        toast.error(data.message);
      }
    } catch (error) {
      setIsAdding(false);
      setFormData({});
      setLocation(null);
      toast.error(error.message);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState(null);
  const handleCategoryChange = (selectedOption) => {
    const category = categories.find((cat) => cat._id === selectedOption._id);
    setSelectedCategory(category);

    // Calculate the price immediately if quantity is already entered
    const quantity = parseFloat(formData.quantity);
    if (quantity) {
      const pricePerKg = category.pricePerKg;
      setFormData((prev) => ({
        ...prev,
        wasteCategory: selectedOption._id,
        estimatedPrice: quantity * pricePerKg,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        wasteCategory: selectedOption._id,
        estimatedPrice: 0, // Reset the price if no quantity entered
      }));
    }
  };

  const submitDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/request/delete/${deleteRequest._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setIsDeleting(false);
        toast.success("Request deleted successfully");
        setDeleteModal(false);
        setDeleteRequest({});
        fetchRequest();
      } else {
        setIsDeleting(false);
        setDeleteRequest({});
        toast.error(data.message);
      }
    } catch (error) {
      setIsDeleting(false);
      setDeleteRequest({});
      toast.error(error.message);
    }
  };

  const [isUpdating, setIsUpdating] = useState(false);
  const submitUpdate = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/request/update/${updateData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          location,
          userId: currentUser._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsUpdating(false);
        toast.success("Request updated successfully");
        setUpdateModal(false);
        setUpdateData({});
        fetchRequest();
      } else {
        setIsUpdating(false);
        setUpdateData({});
        toast.error(data.message);
      }
    } catch (error) {
      setIsUpdating(false);
      setUpdateData({});
      toast.error(error.message);
    }
  };
  const statusOptions = [
    { value: "ACCEPTED", label: "Accepted" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const [isAssigning, setIsAssigning] = useState(false);
  const handleAssignDriver = async () => {
    setIsAssigning(true);
    if (!selectedDriver) {
      setIsAssigning(false);
      return toast.error("Please select a driver");
    }
    const pendingRequests = selectedDriver.wasteRequests.filter(
      (request) => request.requestStatus === "PENDING"
    );
    if (pendingRequests.length >= 10) {
      setIsAssigning(false);
      return toast.error("Driver already has 10 pending requests");
    }
    try {
      const res = await fetch(
        `/api/request/assign-driver/${selectedDriver._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: assignRequest._id,
            driverId: selectedDriver._id,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Driver assigned successfully");
        setAssignDriverModal(false);
        setSelectedDriver("");
        setIsAssigning(false);
        fetchRequest();
      } else {
        setIsAssigning(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsAssigning(false);
      toast.error(error.message);
    }
  };

  const [downloadDistrict, setDownloadDistrict] = useState(null);
  const handleDownalodDistrict = async (selectedOption) => {
    setDownloadDistrict(selectedOption);
  };
  const [downloadCity, setDownloadCity] = useState(null);
  const handleCityChange = async (selectedOption) => {
    setDownloadCity(selectedOption);
  };

  const uniqueCities = Array.from(
    new Map(selectCities.map((city) => [city, city])).values()
  );

  const handleDownload = async () => {
    if (downloadCity !== null) {
      setIsDownloading(true);
      try {
        const res = await fetch("/api/request/generate-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ city: downloadCity.value }),
        });
        if (!res.ok) {
          throw new Error("Failed to generate PDF");
        }
        const pdfBlob = await res.blob();

        const url = window.URL.createObjectURL(pdfBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `City_Report_${downloadCity.label}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadCity(null);
        setIsDownloading(false);
      } catch (error) {
        setDownloadCity(null);
        setIsDownloading(false);
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const [isConfirming, setIsConfirming] = useState(false);
  const submitConfirm = async () => {
    setIsConfirming(true);
    try {
      const res = await fetch("/api/request/confirm-collection", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: confirmRequest._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsConfirming(false);
        toast.success("Collection confirmed successfully");
        setConfirmModal(false);
        setConfirmRequest(null);
        fetchRequest();
      } else {
        setIsConfirming(false);
        setConfirmRequest(null);
        toast.error(data.message);
      }
    } catch (error) {
      setIsConfirming(false);
      setConfirmRequest(null);
      toast.error(error.message);
    }
  };

  
  const handleFilter = (e) => {
    const filter = e.target.value;
    if (filter === "All") {
      fetchRequest();
    } else {
      const filteredRequests = requests.filter(
        (request) => request.requestStatus === filter
      );
      setRequests(filteredRequests);
    }
  };

  const handleDateFilter = (e) => {
    const filter = e.target.value;
    if (filter === "Today") {
      const filteredRequests = requests.filter(
        (request) =>
          new Date(request.pickUpDate).toLocaleDateString() ===
          new Date().toLocaleDateString()
      );
      setRequests(filteredRequests);
    } else if (filter === "Yesterday") {
      const filteredRequests = requests.filter(
        (request) =>
          new Date(request.pickUpDate).toLocaleDateString() ===
          new Date(
            new Date().setDate(new Date().getDate() - 1)
          ).toLocaleDateString()
      );
      setRequests(filteredRequests);
    } else if (filter === "Last_Week") {
      const filteredRequests = requests.filter(
        (request) =>
          new Date(request.pickUpDate) >
          new Date(new Date().setDate(new Date().getDate() - 7))
      );
      setRequests(filteredRequests);
    } else if (filter === "Last_Month") {
      const filteredRequests = requests.filter(
        (request) =>
          new Date(request.pickUpDate) >
          new Date(new Date().setMonth(new Date().getMonth() - 1))
      );
      setRequests(filteredRequests);
    }
  };

  const handlePaymentStatus = (e) => {
    const filter = e.target.value;
    if (filter === "All") {
      fetchRequest();
    } else {
      const filteredRequests = requests.filter(
        (request) => request.paymentStatus === filter
      );
      setRequests(filteredRequests);
    }
  };

  const handleDriverStatus = (e) => {
    const filter = e.target.value;
    if (filter === "All") {
      fetchRequest();
    } else {
      const filteredRequests = requests.filter(
        (request) => request.truckDriverStatus === filter
      );
      setRequests(filteredRequests);
    }
  };

  const [isResetting, setIsResetting] = useState(false);
  const handleReset = () => {
    setIsResetting(true);
    fetchRequest();
    setIsResetting(false);
  };

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      <ToastContainer />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="p-3 md:mx-auto">
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
            </div>
          </div>
          <div>
          <div className="flex items-center mb-3">
              <select
                id="filter"
                onChange={handleFilter}
                className="ml-4 mr-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="defaultvalue" disabled selected>
                  Choose a Status filter option
                </option>
                <option value="All">All</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                id="filter"
                onChange={handlePaymentStatus}
                className="ml-4 mr-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="defaultvalue" disabled selected>
                  Choose a Payment Status filter option
                </option>
                <option value="All">All</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                id="filter"
                onChange={handleDriverStatus}
                className="ml-4 mr-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="defaultvalue" disabled selected>
                  Choose a Driver Status filter option
                </option>
                <option value="All">All</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                id="filter"
                onChange={handleDateFilter}
                className="ml-4 mr-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="defaultvalue" disabled selected>
                  Choose a Date filter option
                </option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last_Week">Last Week</option>
                <option value="Last_Month">Last Month</option>
              </select>

              <Button
                outline
                gradientDuoTone="greenToBlue"
                className=" ml-2"
                onClick={() => handleReset()}
              >
                {isResetting ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  <AiOutlineReload className="w-5 h-5" />
                )}
              </Button>
            </div>
            <div className=" flex items-center mb-2">
              <TextInput
                type="text"
                placeholder="Search by City name"
                onChange={(e) => setSearch(e.target.value)}
                rightIcon={AiOutlineSearch}
                className="ml-1 bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mb"
              />
              <Select
                className="ml-4"
                placeholder="Select a City"
                isSearchable
                options={uniqueCities.map((city) => ({
                  value: city,
                  label: city,
                }))}
                onChange={handleCityChange}
                isClearable
                styles={{
                  control: (provided) => ({
                    ...provided,
                    width: "200px",
                  }),
                  option: (provided) => ({
                    ...provided,
                    color: "black",
                  }),
                  singleValue: (provided) => ({
                    ...provided,
                    color: "black",
                  }),
                }}
              />
              <Button
                outline
                gradientDuoTone="greenToBlue"
                className=" ml-4"
                onClick={() => handleDownload()}
              >
                {isDownloading ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Download Request Report"
                )}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {requests.length > 0 ? (
              <Table>
                <Table.Head>
                  <Table.HeadCell>Pickup Date</Table.HeadCell>
                  <Table.HeadCell>Payment Status</Table.HeadCell>
                  <Table.HeadCell>Request Status</Table.HeadCell>
                  <Table.HeadCell>Driver Status</Table.HeadCell>
                  <Table.HeadCell>Collect Status</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Head>
                {displayRequests}
              </Table>
            ) : (
              <p>No Requests Available</p>
            )}
            <div className="mt-9 center">
              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                pageCount={pageCount}
                onPageChange={handlePageChange}
                containerClassName={"pagination flex justify-center"}
                previousLinkClassName={
                  "inline-flex items-center px-4 py-2 border border-gray-300 rounded-l-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }
                nextLinkClassName={
                  "inline-flex items-center px-4 py-2 border border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }
                disabledClassName={"opacity-50 cursor-not-allowed"}
                activeClassName={"bg-indigo-500 text-white"}
              />
            </div>
          </div>

          {/** Create Request */}
          <Modal
            show={addModal}
            onClose={() => {
              setAddModal(false);
              setFormData({});
              setLocation(null);
            }}
            popup
            size="xl"
          >
            <Modal.Header>Add Waste Request</Modal.Header>
            <Modal.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium"
                  >
                    Quantity (Kg)
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    onChange={handleChange}
                  />
                </div>
                {/* Select Waste Category */}
                <div>
                  <label
                    htmlFor="wasteCategory"
                    className="block text-sm font-medium"
                  >
                    Waste Category
                  </label>
                  <Select
                    options={categories}
                    getOptionLabel={(category) => category.name}
                    getOptionValue={(category) => category._id}
                    id="wasteCategory"
                    name="wasteCategory"
                    onChange={handleCategoryChange} // Update the selected category
                  />
                </div>
                {/* Estimated Price (Auto-Calculated) */}
                <div>
                  <label
                    htmlFor="estimatedPrice"
                    className="block text-sm font-medium"
                  >
                    Estimated Price
                  </label>
                  <input
                    type="text"
                    id="estimatedPrice"
                    name="estimatedPrice"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.estimatedPrice}
                    disabled
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="district">District</Label>
                  <ReactSelect
                    options={districts} // Assuming you are using the above districts structure
                    id="district"
                    isClearable
                    required
                    isSearchable
                    getOptionLabel={(district) => district.name} // Display district names
                    getOptionValue={(district) => district.id} // Use district IDs
                    onChange={handleDistrictChange} // Call the handler when a district is selected
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="city">City</Label>
                  <select
                    style={{ width: "100%" }}
                    id="city"
                    name="city"
                    onChange={handleChange}
                    required
                    disabled={!selectedDistrict}
                  >
                    <option value="default" disabled selected>
                      Select City
                    </option>
                    {cities.map((city, index) => (
                      <option key={index} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enter Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    onChange={handleChange}
                  />
                </div>

                {/* Select Location (Google Places Autocomplete) */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium"
                  >
                    Select Location
                  </label>
                  <LoadScript
                    googleMapsApiKey="AIzaSyCms2-r4afPJIKiStBZUNuRx_4BdU2p9ps"
                    libraries={["places"]}
                  >
                    <GooglePlacesAutocomplete
                      apiKey="AIzaSyCms2-r4afPJIKiStBZUNuRx_4BdU2p9ps"
                      selectProps={{
                        value,
                        onChange: async (place) => {
                          setValue(place);

                          // Fetch lat/lng for the selected place
                          if (place && place.value && place.value.place_id) {
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode(
                              { placeId: place.value.place_id },
                              (results, status) => {
                                if (status === "OK" && results[0]) {
                                  const lat =
                                    results[0].geometry.location.lat();
                                  const lng =
                                    results[0].geometry.location.lng();

                                  // Set the location with longitude first, then latitude
                                  setLocation({
                                    type: "Point",
                                    coordinates: [lng, lat], // [longitude, latitude]
                                  });
                                } else {
                                  console.error("Geocode failed:", status);
                                }
                              }
                            );
                          }
                        },
                      }}
                      fetchDetails={true}
                    />
                  </LoadScript>
                </div>

                {/* Pick-Up Date */}
                <div>
                  <label
                    htmlFor="pickUpDate"
                    className="block text-sm font-medium"
                  >
                    Pick-Up Date
                  </label>
                  <input
                    type="date"
                    id="pickUpDate"
                    name="pickUpDate"
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setAddModal(false);
                  setFormData({});
                  setLocation(null);
                }}
              >
                Cancel
              </Button>
              <Button color="success" onClick={() => handleAddRequest()}>
                {isAdding ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Add Waste Request"
                )}
              </Button>
            </Modal.Footer>
          </Modal>
          {/** View More Modal */}

          <Modal
            show={requestViewModal}
            onClose={() => setRequestViewModal(false)}
            size="xlg"
          >
            <Modal.Header>
              <h2 className="text-2xl font-bold flex items-center">
                <Trash2 className="mr-2" /> Waste Request Details
              </h2>
            </Modal.Header>
            <Modal.Body>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner className="animate-spin" color="gray" size="lg" />
                </div>
              ) : (
                requestData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Waste Request Info */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-xl font-semibold mb-4">
                        Request Information
                      </h3>
                      <div className="space-y-3">
                        <p className="flex items-center">
                          <Trash2 className="mr-2 text-gray-600" size={18} />
                          <strong>Waste Category:</strong>{" "}
                          <span className="ml-1">
                            {requestData?.wasteCategory?.name}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <Weight className="mr-2 text-gray-600" size={18} />
                          <strong>Quantity:</strong>{" "}
                          <span className="ml-1">
                            {requestData?.quantity} kg
                          </span>
                        </p>
                        <p className="flex items-center">
                          <DollarSign
                            className="mr-2 text-gray-600"
                            size={18}
                          />
                          <strong>Estimated Price:</strong>{" "}
                          <span className="ml-1">
                          LKR {requestData?.estimatedPrice}
                          </span>
                        </p>
                        <p className="flex items-center">
                          {requestData?.payment?.isAdminPayment ? (
                            <>
                              <CheckCircle
                                className="mr-2 text-green-600"
                                size={18}
                              />
                              <strong>No Payment Required</strong>
                            </>
                          ) : (
                            <>
                              <XCircle
                                className="mr-2 text-red-600"
                                size={18}
                              />
                              <strong>Payment Required:</strong>
                              <span className="ml-1 text-red-600">
                                LKR {requestData?.payment?.amount}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="flex items-center">
                          <Calendar className="mr-2 text-gray-600" size={18} />
                          <strong>Pick-Up Date:</strong>{" "}
                          <span className="ml-1">
                            {new Date(
                              requestData?.pickUpDate
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <MapPin className="mr-2 text-gray-600" size={18} />
                          <strong>District:</strong>{" "}
                          <span className="ml-1">
                            {requestData?.district?.name}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <Home className="mr-2 text-gray-600" size={18} />
                          <strong>City:</strong>{" "}
                          <span className="ml-1">{requestData?.city}</span>
                        </p>
                        <p className="flex items-center">
                          <MapPin className="mr-2 text-gray-600" size={18} />
                          <strong>Address:</strong>{" "}
                          <span className="ml-1">{requestData?.address}</span>
                        </p>
                      </div>

                      {requestData?.user && (
                        <div className="mt-6">
                          <h3 className="text-xl font-semibold mb-4">
                            User Information
                          </h3>
                          <div className="space-y-3">
                            <p className="flex items-center">
                              <User className="mr-2 text-gray-600" size={18} />
                              <strong>Username:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.user?.username}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <Mail className="mr-2 text-gray-600" size={18} />
                              <strong>Email:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.user?.email}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <Phone className="mr-2 text-gray-600" size={18} />
                              <strong>Phone:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.user?.phone}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <IdCard
                                className="mr-2 text-gray-600"
                                size={18}
                              />
                              <strong>NIC:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.user?.nic}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/** Rating Status */}
                      <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-4">Feedback</h3>
                        {requestData.ratingValue ||
                        requestData.ratingComment ? (
                          <div className="space-y-3">
                            {requestData.ratingValue && (
                              <p className="flex items-center">
                                <Star
                                  className="mr-2 text-yellow-400"
                                  size={18}
                                  fill="currentColor"
                                />
                                <strong>Rating:</strong>
                                <span className="ml-1 flex items-center">
                                  {[...Array(5)].map((_, index) => (
                                    <Star
                                      key={index}
                                      size={18}
                                      className={
                                        index < requestData.ratingValue
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }
                                    />
                                  ))}
                                </span>
                              </p>
                            )}
                            {requestData.ratingComment && (
                              <p className="flex items-start">
                                <Star
                                  className="mr-2 text-gray-600 mt-1"
                                  size={18}
                                />
                                <strong>Comment:</strong>
                                <span className="ml-1">
                                  {requestData.ratingComment}
                                </span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 flex items-center">
                            <Star className="mr-2" size={18} />
                            No feedback provided yet.
                          </p>
                        )}
                      </div>

                      {/* Driver Information */}
                      {requestData?.driver ? (
                        <div className="mt-6">
                          <h3 className="text-xl font-semibold mb-4">
                            Driver Information
                          </h3>
                          <div className="space-y-3">
                            <p className="flex items-center">
                              <User className="mr-2 text-gray-600" size={18} />
                              <strong>Name:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.driver?.name}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <Mail className="mr-2 text-gray-600" size={18} />
                              <strong>Email:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.driver?.email}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <Phone className="mr-2 text-gray-600" size={18} />
                              <strong>Phone:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.driver?.phone}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <Truck className="mr-2 text-gray-600" size={18} />
                              <strong>Vehicle Number:</strong>{" "}
                              <span className="ml-1">
                                {requestData?.driver?.vehicleNumber}
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-6 text-red-500 flex items-center">
                          <User className="mr-2" size={18} />
                          <strong>No driver assigned to this request.</strong>
                        </p>
                      )}
                    </div>

                    {/* Google Map */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <MapPin className="mr-2" /> Location
                      </h3>
                      {requestData?.location?.coordinates ? (
                        <LoadScript googleMapsApiKey="AIzaSyCms2-r4afPJIKiStBZUNuRx_4BdU2p9ps">
                          <GoogleMap
                            mapContainerStyle={{
                              width: "100%",
                              height: "400px",
                              borderRadius: "0.5rem",
                            }}
                            center={{
                              lat: requestData.location.coordinates[1],
                              lng: requestData.location.coordinates[0],
                            }}
                            zoom={15}
                          >
                            <Marker
                              position={{
                                lat: requestData.location.coordinates[1],
                                lng: requestData.location.coordinates[0],
                              }}
                              icon={{
                                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                scaledSize: { width: 30, height: 30 },
                              }}
                            />
                          </GoogleMap>
                        </LoadScript>
                      ) : (
                        <p className="text-gray-500 flex items-center">
                          <MapPin className="mr-2" size={18} />
                          Location data not available.
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button color="gray" onClick={() => setRequestViewModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          {/** Delete Request Modal */}
          <Modal
            show={deleteModal}
            onClose={() => {
              setDeleteModal(false), setDeleteRequest({});
            }}
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold">
                Are you sure you want to delete this request?
              </h3>
            </Modal.Header>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setDeleteModal(false), setDeleteRequest({});
                }}
              >
                Close
              </Button>
              <Button
                color="failure"
                onClick={() => submitDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner size="sm" aria-label="Loading spinner" />
                ) : (
                  "Delete Request"
                )}
              </Button>
            </Modal.Footer>
          </Modal>
          {/** Update Request Modal */}
          <Modal
            show={updateModal}
            onClose={() => {
              setUpdateModal(false);
              setFormData({});
              setLocation(null);
              setUpdateData({});
            }}
            popup
            size="xl"
          >
            <Modal.Header>Update Waste Request</Modal.Header>
            <Modal.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/** Active Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium">
                    Truck Driver Status
                  </label>
                  <Select
                    options={statusOptions}
                    onChange={(selectedOption) => {
                      setFormData({
                        ...formData,
                        truckDriverStatus: selectedOption.value,
                      });
                    }}
                    placeholder={updateData?.truckDriverStatus}
                  />
                </div>
                {/* Quantity */}
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium"
                  >
                    Quantity (Kg)
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    placeholder={updateData?.quantity}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    onChange={handleChange}
                  />
                </div>
                {/* Select Waste Category */}
                <div>
                  <label
                    htmlFor="wasteCategory"
                    className="block text-sm font-medium"
                  >
                    Waste Category
                  </label>
                  <Select
                    options={categories}
                    getOptionLabel={(category) => category.name}
                    getOptionValue={(category) => category._id}
                    id="wasteCategory"
                    placeholder={updateData?.wasteCategory?.name}
                    name="wasteCategory"
                    onChange={handleCategoryChange} // Update the selected category
                  />
                </div>
                {/* Estimated Price (Auto-Calculated) */}
                <div>
                  <label
                    htmlFor="estimatedPrice"
                    className="block text-sm font-medium"
                  >
                    Estimated Price
                  </label>
                  <input
                    type="text"
                    id="estimatedPrice"
                    name="estimatedPrice"
                    placeholder={updateData?.estimatedPrice}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.estimatedPrice}
                    disabled
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="district">District</Label>
                  <ReactSelect
                    options={districts} // Assuming you are using the above districts structure
                    id="district"
                    isClearable
                    required
                    isSearchable
                    placeholder={updateData?.district?.name}
                    getOptionLabel={(district) => district.name} // Display district names
                    getOptionValue={(district) => district.id} // Use district IDs
                    onChange={handleDistrictChange} // Call the handler when a district is selected
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="city">City</Label>
                  <select
                    style={{ width: "100%" }}
                    id="city"
                    name="city"
                    placeholder={updateData?.city}
                    onChange={handleChange}
                    required
                    disabled={!selectedDistrict}
                  >
                    <option value="default" disabled selected>
                      Select City
                    </option>
                    {cities.map((city, index) => (
                      <option key={index} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enter Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder={updateData?.address}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    onChange={handleChange}
                  />
                </div>

                {/* Select Location (Google Places Autocomplete) */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium"
                  >
                    Select Location
                  </label>
                  <LoadScript
                    googleMapsApiKey="AIzaSyCms2-r4afPJIKiStBZUNuRx_4BdU2p9ps"
                    libraries={["places"]}
                  >
                    <GooglePlacesAutocomplete
                      apiKey="AIzaSyCms2-r4afPJIKiStBZUNuRx_4BdU2p9ps"
                      selectProps={{
                        value,
                        onChange: async (place) => {
                          setValue(place);

                          // Fetch lat/lng for the selected place
                          if (place && place.value && place.value.place_id) {
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode(
                              { placeId: place.value.place_id },
                              (results, status) => {
                                if (status === "OK" && results[0]) {
                                  const lat =
                                    results[0].geometry.location.lat();
                                  const lng =
                                    results[0].geometry.location.lng();

                                  // Set the location with longitude first, then latitude
                                  setLocation({
                                    type: "Point",
                                    coordinates: [lng, lat], // [longitude, latitude]
                                  });
                                } else {
                                  console.error("Geocode failed:", status);
                                }
                              }
                            );
                          }
                        },
                      }}
                      fetchDetails={true}
                    />
                  </LoadScript>
                </div>

                {/* Pick-Up Date */}
                <div>
                  <label
                    htmlFor="pickUpDate"
                    className="block text-sm font-medium"
                  >
                    Pick-Up Date
                  </label>
                  <input
                    type="date"
                    id="pickUpDate"
                    placeholder={new Date(
                      updateData?.pickUpDate
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    name="pickUpDate"
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setUpdateModal(false);
                  setFormData({});
                  setLocation(null);
                  setUpdateData({});
                }}
              >
                Cancel
              </Button>
              <Button color="success" onClick={() => submitUpdate()}>
                {isUpdating ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Update Waste Request"
                )}
              </Button>
            </Modal.Footer>
          </Modal>
          {/** Assign Driver Modal */}
          <Modal
            show={assignDriverModal}
            onClose={() => {
              setAssignDriverModal(false);
              setSelectedDriver(null);
              setFilteredDrivers(null);
            }} // Close modal when the modal's close button is clicked
            size="xl"
          >
            <Modal.Header className="px-6 py-4">Assign Driver</Modal.Header>
            <Modal.Body className="px-6 py-4">
              <div className="mb-4">
                <label
                  htmlFor="driverSelect"
                  className="block text-sm font-medium mb-2"
                >
                  Select Available Driver
                </label>
                <Select
                  options={filteredDrivers} // Use filtered drivers based on the waste request's district and city
                  getOptionLabel={(driver) =>
                    `${driver.name} - ${driver.vehicleNumber}`
                  }
                  getOptionValue={(driver) => driver._id}
                  placeholder="Choose a Driver"
                  onChange={(selectedDriver) =>
                    setSelectedDriver(selectedDriver)
                  } // Set selected driver in state
                  className="w-full" // Full width Select component
                />
              </div>
            </Modal.Body>
            <Modal.Footer className="px-6 py-4 flex justify-end space-x-4">
              <Button
                color="green"
                onClick={() => handleAssignDriver(selectedDriver)} // Assign selected driver when clicking confirm
                disabled={!selectedDriver} // Disable button if no driver is selected
                className="px-4 py-2"
              >
                {isAssigning ? (
                  <Spinner size="sm" aria-label="Loading spinner" />
                ) : (
                  "Confirm"
                )}
              </Button>
              <Button
                color="gray"
                onClick={() => {
                  setAssignDriverModal(false);
                  setSelectedDriver(null);
                  setFilteredDrivers(null);
                }} // Close modal when cancel button is clicked
                className="px-4 py-2"
              >
                Cancel
              </Button>
            </Modal.Footer>
          </Modal>
          {/** Confirm Collection */}
          <Modal
            show={confirmModal}
            onClose={() => {
              setConfirmModal(false), setConfirmRequest(null);
            }}
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold">
                Are you sure you want to confirm collection ?
              </h3>
            </Modal.Header>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setConfirmModal(false), setConfirmRequest(null);
                }}
              >
                Close
              </Button>
              <Button
                color="failure"
                onClick={() => submitConfirm()}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <Spinner size="sm" aria-label="Loading spinner" />
                ) : (
                  "Confirm Collection"
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}
