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
import { HiEye, HiOutlineX } from "react-icons/hi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactPaginate from "react-paginate";
import {
  FaUsers,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaThumbsUp,
  FaCreditCard,
} from "react-icons/fa";
import { AiOutlineReload, AiOutlineSearch } from "react-icons/ai";
import Select from "react-select";
import { set } from "mongoose";
import { useSelector } from "react-redux";
import {
  User,
  Mail,
  CreditCard,
  Package,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  IdCard,
} from "lucide-react";
export default function DashAdminPayments() {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSelector((state) => state.user);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalCompletedPaymens, setTotalCompletedPayments] = useState(0);
  const [totalCancelledPayements, setTotalCancelledPayments] = useState(0);
  const [totalPendingPayments, setTotalPendingPayments] = useState(0);
  const [payments, setPayments] = useState([]);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("api/payment/get");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        setLoading(false);
        return;
      }
      setPayments(data.payments);
      setTotalPayments(data.total);
      setTotalCompletedPayments(data.completed);
      setTotalCancelledPayments(data.cancelled);
      setTotalPendingPayments(data.pending);
      setLoading(false);
    } catch (error) {
      setError("Something went wrong. Please try again later");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const [viewData, setViewData] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const handleViewPayment = (payment) => {
    setViewData(payment);
    setViewModal(true);
  };

  const [deleteData, setDeleteData] = useState(null);
  const handleDelete = (payment) => {
    setDeleteData(payment);
    setDeleteModal(true);
  };

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const handlePayment = (payment) => {
    setPaymentData(payment);
    setPaymentModal(true);
  };

  const [pageNumber, setPageNumber] = useState(0);
  const paymentsPerPage = 5;

  const pageCount = Math.ceil(payments?.length / paymentsPerPage);

  const handlePageChange = ({ selected }) => {
    setPageNumber(selected);
  };

  const displayPayments = payments
    .slice(pageNumber * paymentsPerPage, (pageNumber + 1) * paymentsPerPage)
    .map((payment) => (
      <Table.Body className="divide-y">
        <Table.Row
          key={payment._id}
          className="bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          <Table.Cell>
            {new Date(payment?.paymentDueDate).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Table.Cell>
          <Table.Cell>
            {payment?.paymentStatus === "PENDING" ? (
              <Badge color="warning" className="justify-center">
                <FaExclamationTriangle className="mr-2 w-6 h-10" />
              </Badge>
            ) : payment.paymentStatus === "COMPLETED" ? (
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
            {payment?.request?.requestStatus === "PENDING" ? (
              <Badge color="warning" className="justify-center">
                <FaExclamationTriangle className="mr-2 w-6 h-10" />
              </Badge>
            ) : payment?.request?.requestStatus === "ACCEPTED" ? (
              <Badge color="success" className="justify-center">
                <FaCheckCircle className="mr-2 w-6 h-10" />
              </Badge>
            ) : (
              <Badge color="failure" className="justify-center">
                <FaTimesCircle className="mr-2 w-6 h-10" />
              </Badge>
            )}
          </Table.Cell>
          <Table.Cell>{payment?.paymentMethod}</Table.Cell>
          <Table.Cell>
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                color="gray"
                onClick={() => handleViewPayment(payment)}
              >
                <HiEye className="mr-2 h-5 w-5" />
                View
              </Button>
              <Button
                size="sm"
                color="blue"
                disabled={
                  payment?.paymentStatus === "COMPLETED" ||
                  payment?.isAdminPayment === false ||
                  payment?.request?.requestStatus === "PENDING"
                }
                onClick={() => handlePayment(payment)}
                outline
              >
                <FaCreditCard className="mr-2 h-5 w-5" />
                Make Payment
              </Button>
              <Button
                size="sm"
                color="failure"
                disabled={isDeleting}
                outline
                onClick={() => handleDelete(payment)}
              >
                <HiOutlineX className="mr-2 h-5 w-5" />
                Delete
              </Button>
            </div>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    ));

  const handleDeleteSubmit = async (payment) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`api/payment/delete/${payment._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        setIsDeleting(false);
        return;
      }
      toast.success(data.message);
      fetchPayments();
      setIsDeleting(false);
      setDeleteModal(false);
      setDeleteData(null);
    } catch (error) {
      setError("Something went wrong. Please try again later");
      setIsDeleting(false);
    }
  };
  const [isPaying, setIsPaying] = useState(false);
  const handleSubmit = async (e) => {
    setIsPaying(true);
    e.preventDefault();
    try {
      const res = await fetch(`api/payment/paymentSubmit/${paymentData._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardNumber,
          expiryDate,
          cvv,
          name,
          amount: paymentData.amount,
          paymentDueDate: paymentData.paymentDueDate,
          paymentMethod: "Card",
          paymentStatus: "COMPLETED",
          request: paymentData.request._id,
          user: currentUser._id,
          isAdminPayment: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success("Payment Successful");
      fetchPayments();
      setIsPaying(false);
      setPaymentModal(false);
      setPaymentData(null);
    } catch (error) {
      setIsPaying(false);
      setError("Something went wrong. Please try again later");
    }
  };

  const handleFilter = (e) => {
    const filter = e.target.value;
    if (filter === "All") {
      fetchPayments();
    } else {
      const filteredPayments = payments.filter(
        (payment) => payment.paymentStatus === filter
      );
      setPayments(filteredPayments);
    }
  };

  const handleDateFilter = (e) => {
    const filter = e.target.value;
    if (filter === "Today") {
      const today = new Date();
      const filteredPayments = payments.filter(
        (payment) =>
          new Date(payment.paymentDueDate).toLocaleDateString() ===
          today.toLocaleDateString()
      );
      setPayments(filteredPayments);
    } else if (filter === "Yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const filteredPayments = payments.filter(
        (payment) =>
          new Date(payment.paymentDueDate).toLocaleDateString() ===
          yesterday.toLocaleDateString()
      );
      setPayments(filteredPayments);
    }
    if (filter === "Last_Week") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const filteredPayments = payments.filter(
        (payment) =>
          new Date(payment.paymentDueDate) >= lastWeek &&
          new Date(payment.paymentDueDate) <= new Date()
      );
      setPayments(filteredPayments);
    }
    if (filter === "Last_Month") {
      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);
      const filteredPayments = payments.filter(
        (payment) =>
          new Date(payment.paymentDueDate) >= lastMonth &&
          new Date(payment.paymentDueDate) <= new Date()
      );
      setPayments(filteredPayments);
    }
  };

  const handleStatusRequestFilter = (e) => {
    const filter = e.target.value;
    if (filter === "All") {
      fetchPayments();
    } else {
      const filteredPayments = payments.filter(
        (payment) => payment.request.requestStatus === filter
      );
      setPayments(filteredPayments);
    }
  };
  const [isResetting, setIsResetting] = useState(false);
  const handleReset = () => {
    setIsResetting(true);
    fetchPayments();
    setIsResetting(false);
  };

  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const handleCriteriaChange = (selected) => {
    setSelectedCriteria(selected.value);
  };

  const handleReportDownload = async () => {
    if (selectedCriteria !== null) {
      setIsDownloading(true);
      try {
        const res = await fetch("api/payment/downloadReportStatus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentStatus: selectedCriteria,
          }),
        });
        if (!res.ok) {
          throw new Error("Failed to generate PDF");
        }
        const pdfBlob = await res.blob();

        const url = window.URL.createObjectURL(pdfBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `Payment_Report_${selectedCriteria}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsDownloading(false);
        setSelectedCriteria(null);
      } catch (error) {
        setError("Something went wrong. Please try again later");
        setIsDownloading(false);
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
                      Total Payments
                    </h3>
                    <p className="text-2xl">{totalPayments}</p>
                  </div>
                  <FaCreditCard className="bg-blue-500 text-white  text-5xl p-3 shadow-lg" />
                </div>
              </div>
              <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                <div className="flex justify-between">
                  <div className="">
                    <h3 className="text-gray-500 text-md uppercase">
                      Total Pending Payments
                    </h3>
                    <p className="text-2xl">{totalPendingPayments}</p>
                  </div>
                  <FaCreditCard className="bg-yellow-500 text-white  text-5xl p-3 shadow-lg" />
                </div>
              </div>
              <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                <div className="flex justify-between">
                  <div className="">
                    <h3 className="text-gray-500 text-md uppercase">
                      Completed Payments
                    </h3>
                    <p className="text-2xl">{totalCompletedPaymens}</p>
                  </div>
                  <FaCreditCard className="bg-green-500 text-white  text-5xl p-3 shadow-lg" />
                </div>
              </div>
              <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                <div className="flex justify-between">
                  <div className="">
                    <h3 className="text-gray-500 text-md uppercase">
                      Cancelled Payments
                    </h3>
                    <p className="text-2xl">{totalCancelledPayements}</p>
                  </div>
                  <FaCreditCard className="bg-red-500 text-white text-5xl p-3 shadow-lg" />
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
                  Choose a Payment Status filter option
                </option>
                <option value="All">All</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                id="filter"
                onChange={handleStatusRequestFilter}
                className="ml-4 mr-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="defaultvalue" disabled selected>
                  Choose a Request Status filter option
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
              <Select
                className="ml-4"
                placeholder="Select a Status"
                isSearchable
                isClearable
                onChange={handleCriteriaChange}
                options={[
                  { label: "All", value: "all" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Completed", value: "COMPLETED" },
                  { label: "Cancelled", value: "CANCELLED" },
                ]}
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
                onClick={() => handleReportDownload()}
                disabled={!selectedCriteria}
              >
                {isDownloading ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Download Payment Report"
                )}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {payments.length > 0 ? (
              <Table>
                <Table.Head>
                  <Table.HeadCell>Payment Due Date</Table.HeadCell>
                  <Table.HeadCell>Payment Status</Table.HeadCell>
                  <Table.HeadCell>Request Status</Table.HeadCell>
                  <Table.HeadCell>Payment Method</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Head>
                {displayPayments}
              </Table>
            ) : (
              <p>No Payments Available</p>
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
          {/** View More Modal */}
          <Modal
            show={viewModal}
            onClose={() => {
              setViewModal(false);
              setViewData(null);
            }}
            size="xlg"
          >
            <Modal.Header>
              <h2 className="text-2xl font-bold flex items-center">
                <CreditCard className="mr-2" /> Payment Details
              </h2>
            </Modal.Header>
            <Modal.Body>
              {viewData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Information */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-xl font-semibold mb-4">
                        Payment Information
                      </h3>
                      <div className="space-y-3">
                        <p className="flex items-center">
                          <CreditCard
                            className="mr-2 text-gray-600"
                            size={18}
                          />
                          <strong>Payment Method:</strong>{" "}
                          <span className="ml-1">
                            {viewData?.paymentMethod}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <CheckCircle
                            className={`mr-2 ${
                              viewData?.paymentStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.paymentStatus === "COMPLETED"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                            size={18}
                          />
                          <strong>Payment Status:</strong>
                          <span
                            className={`ml-1 font-semibold ${
                              viewData?.paymentStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.paymentStatus === "COMPLETED"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {viewData?.paymentStatus}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <AlertCircle
                            className="mr-2 text-gray-600"
                            size={18}
                          />
                          <strong>Amount:</strong>{" "}
                          <span className="ml-1">LKR {viewData?.amount}</span>
                        </p>
                        <p className="flex items-center">
                          <Package className="mr-2 text-gray-600" size={18} />
                          <strong>Payment Due Date:</strong>{" "}
                          <span className="ml-1">
                            {new Date(
                              viewData?.paymentDueDate
                            ).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <CheckCircle
                            className={`mr-2 ${
                              viewData?.isAdminPayment
                                ? "text-blue-500"
                                : "text-gray-600"
                            }`}
                            size={18}
                          />
                          <strong>Admin Payment:</strong>
                          <span className="ml-1">
                            {viewData?.isAdminPayment ? "Yes" : "No"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-xl font-semibold mb-4">
                        User Information
                      </h3>
                      <div className="space-y-3">
                        <p className="flex items-center">
                          <User className="mr-2 text-gray-600" size={18} />
                          <strong>Username:</strong>{" "}
                          <span className="ml-1">
                            {viewData?.user?.username}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <Mail className="mr-2 text-gray-600" size={18} />
                          <strong>Email:</strong>{" "}
                          <span className="ml-1">{viewData?.user?.email}</span>
                        </p>
                        <p className="flex items-center">
                          <Phone className="mr-2 text-gray-600" size={18} />
                          <strong>Phone:</strong>{" "}
                          <span className="ml-1">{viewData?.user?.phone}</span>
                        </p>
                        <p className="flex items-center">
                          <IdCard className="mr-2 text-gray-600" size={18} />
                          <strong>NIC:</strong>{" "}
                          <span className="ml-1">{viewData?.user?.nic}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Waste Request Information */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Package className="mr-2" /> Waste Request Information
                    </h3>
                    {viewData?.request ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <p className="flex items-center">
                          <Package className="mr-2 text-gray-600" size={18} />
                          <strong>Waste Category:</strong>{" "}
                          <span className="ml-1">
                            {viewData?.request?.wasteCategory?.name}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <MapPin className="mr-2 text-gray-600" size={18} />
                          <strong>Address:</strong>{" "}
                          <span className="ml-1">
                            {viewData?.request?.address}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <MapPin className="mr-2 text-gray-600" size={18} />
                          <strong>City:</strong>{" "}
                          <span className="ml-1">
                            {viewData?.request?.city}
                          </span>
                        </p>

                        {/** Request Status */}
                        <p className="flex items-center">
                          <CheckCircle
                            className={`mr-2 ${
                              viewData?.request?.collectionStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.collectionStatus ===
                                  "COMPLETED"
                                ? "text-green-500"
                                : viewData?.request?.collectionStatus ===
                                  "FAILED"
                                ? "text-red-500"
                                : viewData?.request?.collectionStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                            size={18}
                          />
                          <strong>Request Status:</strong>{" "}
                          <span
                            className={`ml-1 font-semibold ${
                              viewData?.request?.requestStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.requestStatus ===
                                  "ACCEPTED"
                                ? "text-green-500"
                                : viewData?.request?.requestStatus ===
                                  "REJECTED"
                                ? "text-red-500"
                                : viewData?.request?.requestStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                          >
                            {viewData?.request?.requestStatus}
                          </span>
                        </p>

                        {/* Handling multiple statuses with color coding */}
                        <p className="flex items-center">
                          <CheckCircle
                            className={`mr-2 ${
                              viewData?.request?.paymentStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.paymentStatus ===
                                  "COMPLETED"
                                ? "text-green-500"
                                : viewData?.request?.paymentStatus ===
                                  "CANCELLED"
                                ? "text-red-500"
                                : viewData?.request?.paymentStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                            size={18}
                          />
                          <strong>Request Payment Status:</strong>{" "}
                          <span
                            className={`ml-1 font-semibold ${
                              viewData?.request?.paymentStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.paymentStatus ===
                                  "COMPLETED"
                                ? "text-green-500"
                                : viewData?.request?.paymentStatus ===
                                  "CANCELLED"
                                ? "text-red-500"
                                : viewData?.request?.paymentStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                          >
                            {viewData?.request?.paymentStatus}
                          </span>
                        </p>

                        <p className="flex items-center">
                          <CheckCircle
                            className={`mr-2 ${
                              viewData?.request?.truckDriverStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.truckDriverStatus ===
                                  "ACCEPTED"
                                ? "text-green-500"
                                : viewData?.request?.truckDriverStatus ===
                                  "REJECTED"
                                ? "text-red-500"
                                : viewData?.request?.truckDriverStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                            size={18}
                          />
                          <strong>Truck Driver Status:</strong>{" "}
                          <span
                            className={`ml-1 font-semibold ${
                              viewData?.request?.truckDriverStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.truckDriverStatus ===
                                  "ACCEPTED"
                                ? "text-green-500"
                                : viewData?.request?.truckDriverStatus ===
                                  "REJECTED"
                                ? "text-red-500"
                                : viewData?.request?.truckDriverStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                          >
                            {viewData?.request?.truckDriverStatus}
                          </span>
                        </p>

                        <p className="flex items-center">
                          <CheckCircle
                            className={`mr-2 ${
                              viewData?.request?.collectionStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.collectionStatus ===
                                  "COMPLETED"
                                ? "text-green-500"
                                : viewData?.request?.collectionStatus ===
                                  "CANCELLED"
                                ? "text-red-500"
                                : viewData?.request?.collectionStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                            size={18}
                          />
                          <strong>Request Collection Status:</strong>{" "}
                          <span
                            className={`ml-1 font-semibold ${
                              viewData?.request?.collectionStatus === "PENDING"
                                ? "text-yellow-500"
                                : viewData?.request?.collectionStatus ===
                                  "COMPLETED"
                                ? "text-green-500"
                                : viewData?.request?.collectionStatus ===
                                  "CANCELLED"
                                ? "text-red-500"
                                : viewData?.request?.collectionStatus ===
                                  "PROCESSING"
                                ? "text-blue-500"
                                : "text-gray-500" // Fallback color for any other statuses
                            }`}
                          >
                            {viewData?.request?.collectionStatus}
                          </span>
                        </p>

                        <p className="flex items-center">
                          <MapPin className="mr-2 text-gray-600" size={18} />
                          <strong>Location:</strong>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${viewData?.request?.location?.coordinates[1]},${viewData?.request?.location?.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-blue-500 hover:underline"
                          >
                            View on Map
                          </a>
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No waste request associated with this payment.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setViewModal(false);
                  setViewData(null);
                }}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          {/** Delete Payment Modal */}
          <Modal
            show={deleteModal}
            onClose={() => {
              setDeleteModal(false);
              setDeleteData(null);
            }}
          >
            <Modal.Header>
              <h2 className="text-2xl font-bold flex items-center">
                <HiOutlineX className="mr-2" /> Delete Payment
              </h2>
            </Modal.Header>
            <Modal.Body>
              <p className="text-gray-500">
                Are you sure you want to delete this payment?
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setDeleteModal(false);
                  setDeleteData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="failure"
                onClick={() => handleDeleteSubmit(deleteData)}
              >
                {isDeleting ? <Spinner color="white" size="sm" /> : "Delete"}
              </Button>
            </Modal.Footer>
          </Modal>
          {/** Payment Modal */}
          <Modal
            show={paymentModal}
            onClose={() => {
              setPaymentModal(false);
              setPaymentData(null);
            }}
            size="xl"
          >
            <Modal.Header>
              <h2 className="text-2xl font-bold flex items-center">
                <CreditCard className="mr-2" /> Payment Details
              </h2>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    Payment Summary
                  </h3>
                  <div className="space-y-3">
                    <p className="flex items-center">
                      <Package className="mr-2 text-gray-600" size={18} />
                      <strong>Waste Category:</strong>{" "}
                      <span className="ml-1">
                        {paymentData?.request?.wasteCategory?.name}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <AlertCircle className="mr-2 text-gray-600" size={18} />
                      <strong>Amount:</strong>{" "}
                      <span className="ml-1 text-lg font-bold">
                        LKR {paymentData?.amount}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <CheckCircle className="mr-2 text-blue-500" size={18} />
                      <strong>Status:</strong>{" "}
                      <span className="ml-1 font-semibold text-blue-500">
                        Ready for Payment
                      </span>
                    </p>
                  </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <TextInput
                      id="card-number"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry-date">Expiry Date</Label>
                      <TextInput
                        id="expiry-date"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <TextInput
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name">Name on Card</Label>
                    <TextInput
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </form>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setPaymentModal(false);
                  setPaymentData(null);
                }}
              >
                Cancel
              </Button>
              <Button color="blue" onClick={handleSubmit}>
                {isPaying ? (
                  <Spinner color="white" size="sm" />
                ) : (
                  "Pay LKR " + paymentData?.amount
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}
