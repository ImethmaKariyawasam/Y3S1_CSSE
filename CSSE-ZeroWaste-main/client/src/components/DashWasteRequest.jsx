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
import { HiEye, HiOutlineX, HiChatAlt2 } from "react-icons/hi";
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
} from "react-icons/fa";
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
  Star,
  Map,
  Package,
  Scale,
} from "lucide-react";
import { AiOutlineReload, AiOutlineSearch } from "react-icons/ai";
import { format } from "date-fns";
import { RiGovernmentLine } from "react-icons/ri";
import Select from "react-select";
import { useSelector } from "react-redux";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"; // For Google Maps autocomplete
import { connectStorageEmulator } from "firebase/storage";
import { MdLocalShipping } from "react-icons/md";
import { set } from "mongoose";
export default function DashWasteRequest() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [totalrequests, setTotalRequests] = useState(0);
  const [rating, setRating] = useState(0);
  const [dates, setDates] = useState([]);
  const [comment, setComment] = useState("");
  const [totalPendingDriverRequests, setTotalPendingDriverRequests] =
    useState(0);
  const [totalAcceptedDriverRequests, setTotalAcceptedDriverRequests] =
    useState(0);
  const [totalRejectedDriverRequests, setTotalRejectedDriverRequests] =
    useState(0);
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
      const res = await fetch(`/api/request/get/${currentUser._id}`, {});
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const uniqueDates = [
          ...new Set(data.wasteRequests.map((request) => request.pickUpDate)),
        ];
        setDates(uniqueDates);
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
        setLoading(false);
        setIsLoading(false);
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

  useEffect(() => {
    fetchRequest();
    fetchDistricts();
    fetchCategories();
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

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({});
  const handleFeedBack = (request) => {
    setFeedbackModal(true);
    setFeedbackData(request);
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
                size="sm"
                color="blue" // A more engaging color for feedback, like blue
                className="flex items-center hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition-all duration-150 ease-in-out"
                disabled={
                  request.collectionStatus === "PENDING" ||
                  request.requestStatus === "REJECTED" ||
                  request.requestStatus === "PENDING" ||
                  request.collectionStatus === "PENDING"
                }
                onClick={() => handleFeedBack(request)}
              >
                <HiChatAlt2 className="mr-2 w-6 h-6" />
                Feedback
              </Button>
              <Button
                color="green"
                type="submit"
                outline
                className="flex items-center"
                onClick={() => handleUpdate(request)}
                disabled={
                  request.requestStatus === "ACCEPTED" ||
                  request.requestStatus === "REJECTED" ||
                  request.requestStatus === "COMPLETED" ||
                  request.paymentStatus === "COMPLETED" ||
                  request.paymentStatus === "CANCELLED"
                } // Disable the button if the status is "PENDING"
              >
                <FaClipboardList className="mr-2 w-6 h-6" />
                Update
              </Button>
              <Button
                size="sm"
                color="failure"
                outline
                className="flex items-center"
                onClick={() => handleDelete(request)}
                disabled={
                  request.requestStatus === "ACCEPTED" ||
                  request.requestStatus === "REJECTED"
                }
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
    if (
      new Date(formData.pickUpDate) <
      new Date(new Date().setDate(new Date().getDate() + 2))
    ) {
      setIsAdding(false);
      return toast.error("Pick-Up date must be at least 2 days in the future.");
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleFeedBackSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/request/feedback`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: feedbackData._id,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Feedback submitted successfully");
        setFeedbackModal(false);
        setFeedbackData({});
        fetchRequest();
        setRating(0);
        setComment("");
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        setRating(0);
        setComment("");
        toast.error(data.message);
      }
    } catch (error) {
      setIsSubmitting(false);
      setRating(0);
      setComment("");
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

  const [selectedDate, setSelectedDate] = useState(null);
  const handleDateChange = (selectedOption) => {
    setSelectedDate(selectedOption);
  };

  const handleDownload = async () => {
    if (selectedDate !== null) {
      setIsDownloading(true);
      try {
        const res = await fetch("/api/request/generate-user-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: currentUser._id, date: selectedDate }),
        });
        if (!res.ok) {
          setIsDownloading(false);
          throw new Error("Failed to generate PDF");
        }
        const pdfBlob = await res.blob();

        const url = window.URL.createObjectURL(pdfBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `Waste_Request_Report_${selectedDate.label}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsDownloading(false);
        setSelectedDate(null);
        setDownloadDistrict(null);
      } catch (error) {
        isDownloading(false);
        setDownloadDistrict(null);
        console.log(error);
        toast.error(error.message);
      }
    }
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
              <Button
                outline
                gradientDuoTone="greenToBlue"
                className="ml-4 mr-5"
                onClick={() => handleAdd()}
              >
                Create Requests
              </Button>
              <TextInput
                type="text"
                placeholder="Search by district name"
                onChange={(e) => setSearch(e.target.value)}
                rightIcon={AiOutlineSearch}
                className="ml-1 bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mb"
              />
              <Select
                className="ml-4"
                placeholder="Select Date"
                isSearchable
                isClearable
                onChange={handleDateChange}
                value={selectedDate}
                options={dates.map((date) => ({
                  value: date,
                  label: format(new Date(date), "MMMM dd, yyyy"),
                }))}
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
                  <Table.HeadCell>Payment status</Table.HeadCell>
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
            size="4xl"
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Package className="mr-2" /> Add Waste Request
              </h3>
            </Modal.Header>
            <Modal.Body>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quantity */}
                  <div>
                    <Label
                      htmlFor="quantity"
                      className="flex items-center mb-2"
                    >
                      <Scale className="mr-2" /> Quantity (Kg)
                    </Label>
                    <TextInput
                      type="number"
                      id="quantity"
                      name="quantity"
                      required
                      placeholder="Enter quantity"
                      onChange={handleChange}
                    />
                  </div>

                  {/* Select Waste Category */}
                  <div>
                    <Label
                      htmlFor="wasteCategory"
                      className="flex items-center mb-2"
                    >
                      <Package className="mr-2" /> Waste Category
                    </Label>
                    <Select
                      options={categories}
                      getOptionLabel={(category) => category.name}
                      getOptionValue={(category) => category._id}
                      id="wasteCategory"
                      name="wasteCategory"
                      onChange={handleCategoryChange}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  {/* Estimated Price */}
                  <div>
                    <Label
                      htmlFor="estimatedPrice"
                      className="flex items-center mb-2"
                    >
                      <DollarSign className="mr-2" /> Estimated Price
                    </Label>
                    <TextInput
                      type="text"
                      id="estimatedPrice"
                      name="estimatedPrice"
                      value={formData.estimatedPrice}
                      disabled
                    />
                  </div>

                  {/* District */}
                  <div>
                    <Label
                      htmlFor="district"
                      className="flex items-center mb-2"
                    >
                      <MapPin className="mr-2" /> District
                    </Label>
                    <Select
                      options={districts}
                      id="district"
                      isClearable
                      required
                      isSearchable
                      getOptionLabel={(district) => district.name}
                      getOptionValue={(district) => district.id}
                      onChange={handleDistrictChange}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <Label htmlFor="city" className="flex items-center mb-2">
                      <MapPin className="mr-2" /> City
                    </Label>
                    <select
                      id="city"
                      name="city"
                      onChange={handleChange}
                      required
                      disabled={!selectedDistrict}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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

                  {/* Address */}
                  <div>
                    <Label htmlFor="address" className="flex items-center mb-2">
                      <Home className="mr-2" /> Address
                    </Label>
                    <TextInput
                      type="text"
                      id="address"
                      name="address"
                      required
                      placeholder="Enter address"
                      onChange={handleChange}
                    />
                  </div>

                  {/* Select Location */}
                  <div>
                    <Label
                      htmlFor="location"
                      className="flex items-center mb-2"
                    >
                      <Map className="mr-2" /> Select Location
                    </Label>
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
                            if (place?.value?.place_id) {
                              const geocoder =
                                new window.google.maps.Geocoder();
                              geocoder.geocode(
                                { placeId: place.value.place_id },
                                (results, status) => {
                                  if (status === "OK" && results[0]) {
                                    const lat =
                                      results[0].geometry.location.lat();
                                    const lng =
                                      results[0].geometry.location.lng();
                                    setLocation({
                                      type: "Point",
                                      coordinates: [lng, lat],
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
                    <Label
                      htmlFor="pickUpDate"
                      className="flex items-center mb-2"
                    >
                      <Calendar className="mr-2" /> Pick-Up Date
                    </Label>
                    <TextInput
                      type="date"
                      id="pickUpDate"
                      name="pickUpDate"
                      required
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    color="success"
                    onClick={() => handleAddRequest()}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <Spinner className="mr-2 animate-spin" size="sm" />
                    ) : (
                      <Package className="mr-2" />
                    )}
                    {isAdding ? "Adding..." : "Add Waste Request"}
                  </Button>
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
                </div>
              </form>
            </Modal.Body>
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
                                LKR {requestData?.payment?.amount || 0}
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
            size="4xl"
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Package className="mr-2" /> Update Waste Request
              </h3>
            </Modal.Header>
            <Modal.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantity */}
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <Scale className="mr-2" /> Quantity (Kg)
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
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <Package className="mr-2" /> Waste Category
                  </label>
                  <Select
                    options={categories}
                    getOptionLabel={(category) => category.name}
                    getOptionValue={(category) => category._id}
                    id="wasteCategory"
                    placeholder={updateData?.wasteCategory?.name}
                    name="wasteCategory"
                    onChange={handleCategoryChange}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Estimated Price */}
                <div>
                  <label
                    htmlFor="estimatedPrice"
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <DollarSign className="mr-2" /> Estimated Price
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

                {/* District */}
                <div>
                  <label
                    htmlFor="district"
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <MapPin className="mr-2" /> District
                  </label>
                  <Select
                    options={districts}
                    id="district"
                    isClearable
                    required
                    isSearchable
                    placeholder={updateData?.district?.name}
                    getOptionLabel={(district) => district.name}
                    getOptionValue={(district) => district.id}
                    onChange={handleDistrictChange}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <MapPin className="mr-2" /> City
                  </label>
                  <select
                    id="city"
                    name="city"
                    placeholder={updateData?.city}
                    onChange={handleChange}
                    required
                    disabled={!selectedDistrict}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <Home className="mr-2" /> Address
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

                {/* Select Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <Map className="mr-2" /> Select Location
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
                          if (place?.value?.place_id) {
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode(
                              { placeId: place.value.place_id },
                              (results, status) => {
                                if (status === "OK" && results[0]) {
                                  const lat =
                                    results[0].geometry.location.lat();
                                  const lng =
                                    results[0].geometry.location.lng();
                                  setLocation({
                                    type: "Point",
                                    coordinates: [lng, lat],
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
                    className="block text-sm font-medium flex items-center mb-2"
                  >
                    <Calendar className="mr-2" /> Pick-Up Date
                  </label>
                  <input
                    type="date"
                    id="pickUpDate"
                    name="pickUpDate"
                    placeholder={new Date(
                      updateData?.pickUpDate
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="flex justify-center gap-4 w-full">
                <Button color="success" onClick={() => submitUpdate()}>
                  {isUpdating ? (
                    <Spinner className="mr-2 animate-spin" size="sm" />
                  ) : (
                    <Package className="mr-2" />
                  )}
                  {isUpdating ? "Updating..." : "Update Waste Request"}
                </Button>
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
              </div>
            </Modal.Footer>
          </Modal>
          {/** Feedback Modal */}
          <Modal
            show={feedbackModal}
            onClose={() => {
              setFeedbackModal(false);
              setFeedbackData({});
              setRating(0);
              setComment("");
            }}
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold">Provide Feedback</h3>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rating" className="mb-2 block">
                    Rating
                  </Label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        className={`cursor-pointer ${
                          star <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="comment" className="mb-2 block">
                    Comment
                  </Label>
                  <TextInput
                    id="comment"
                    type="text"
                    placeholder="Your feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setFeedbackModal(false);
                  setFeedbackData({});
                  setRating(0);
                  setComment("");
                }}
              >
                Close
              </Button>
              <Button color="blue" onClick={handleFeedBackSubmit}>
                {isSubmitting ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}
