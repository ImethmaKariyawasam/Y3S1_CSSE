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
  Textarea,
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
} from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import { RiGovernmentLine } from "react-icons/ri";
import Select from "react-select";
import { set } from "mongoose";
export default function DashDistricts() {
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [totalDistricts, setTotalDistricts] = useState(0);
  const [totalActiveDistricts, setTotalActiveDistricts] = useState(0);
  const [totalInactiveDistricts, setTotalInactiveDistricts] = useState(0);
  const [totalCities, setTotalCities] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const fetchDistricts = async () => {
    try {
      const res = await fetch("/api/district/get");
      const data = await res.json();
      if (res.ok) {
        const filteredDistricts = data.districts.filter((district) => {
          return (
            district.name.toLowerCase().includes(search.toLowerCase()) ||
            district.districtCode.toLowerCase().includes(search.toLowerCase())
          );
        });
        const selectDistricts = filteredDistricts.map((district) => ({
          value: district._id,
          label: district.name,
        }));
        setSelectedDistrict(selectDistricts);
        setDistricts(filteredDistricts);
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
  useEffect(() => {
    fetchDistricts();
  }, [search]);

  const [viewCitiesModal, setViewCitiesModal] = useState(false);
  const [viewDistrict, setViewDistrict] = useState(null);
  const handleCitiesView = (district) => {
    setViewCitiesModal(true);
    setViewDistrict(district);
  };

  const [addDistrict, setAddDistrict] = useState(false);
  const handleAddDistrict = () => {
    setAddDistrict(true);
  };

  const [deleteDistrict, setDeleteDistrict] = useState(null);
  const handleDelete = (district) => {
    setDeleteModal(true);
    setDeleteDistrict(district);
  };

  const [updateModal, setUpdateModal] = useState(false);
  const [updateDistrict, setUpdateDistrict] = useState(null);
  const handleUpdate = (district) => {
    setUpdateModal(true);
    setUpdateDistrict(district);
  };

  const [driverViewModal, setDriverViewModal] = useState(false);
  const [driverViewDistrict, setDriverViewDistrict] = useState(null);
  const handleDriverView = (district) => {
    setDriverViewModal(true);
    setDriverViewDistrict(district);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleCityChange = (e) => {
    const inputCities = e.target.value;
    const updatedCitiesString = inputCities
      .split(",")
      .map((city) => city.trim())
      .join(", "); // Keep it as a string

    // Update updateDistrict and formData with the new cities string
    setUpdateDistrict({ ...updateDistrict, cities: updatedCitiesString });
    setFormData({ ...formData, cities: updatedCitiesString }); // Store as a string
  };

  const [requestViewModal, setRequestViewModal] = useState(false);
  const [requestViewDistrict, setRequestViewDistrict] = useState(null);
  const handleWasteRequestView = (district) => {
    setRequestViewModal(true);
    setRequestViewDistrict(district);
  };

  const [pageNumber, setPageNumber] = useState(0);
  const districtsPerPage = 5;

  const pageCount = Math.ceil(districts.length / districtsPerPage);

  const handlePageChange = ({ selected }) => {
    setPageNumber(selected);
  };

  const displayDistrict = districts
    .slice(pageNumber * districtsPerPage, (pageNumber + 1) * districtsPerPage)
    .map((district) => (
      <Table.Body className="divide-y">
        <Table.Row
          key={district._id}
          className="bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          <Table.Cell>{district.name}</Table.Cell>
          <Table.Cell>{district?.districtCode}</Table.Cell>
          <Table.Cell>
            <Button
              size="sm"
              color="gray"
              onClick={() => handleCitiesView(district)}
            >
              <HiEye className="mr-2 h-5 w-5" />
              View
            </Button>
          </Table.Cell>
          <Table.Cell>
            {
              <Badge
                color={
                  district.isActive === true
                    ? "success"
                    : district.isActive === false
                    ? "failure"
                    : "yellow"
                }
                style={{
                  fontSize: "1.2rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  display: "flex", // Use flexbox
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {district.isActive ? (
                  <FaCheckCircle color="green" size={20} /> // Checkmark icon for verified
                ) : (
                  <FaTimesCircle color="red" size={20} /> // Cross icon for not verified
                )}
              </Badge>
            }
          </Table.Cell>
          <Table.Cell>
            <Button
              size="sm"
              color="gray"
              disabled={district.TruckDrivers.length == 0}
              onClick={() => handleDriverView(district)}
            >
              <HiEye className="mr-2 h-5 w-5" />
              View
            </Button>
          </Table.Cell>
          <Table.Cell>
            <Button
              size="sm"
              color="gray"
              disabled={district.wasteRequests.length == 0}
              onClick={() => handleWasteRequestView(district)}
            >
              <HiEye className="mr-2 h-5 w-5" />
              View
            </Button>
          </Table.Cell>
          <Table.Cell>
            <div className="flex items-center space-x-4">
              <Button
                color="green"
                type="submit"
                outline
                onClick={() => handleUpdate(district)}
              >
                <FaClipboardList className="mr-2 h-5 w-5" />
                Update
              </Button>
              <Button
                size="sm"
                color="failure"
                disabled={isDeleting}
                outline
                onClick={() => handleDelete(district)}
              >
                <HiOutlineX className="mr-2 h-5 w-5" />
                Delete
              </Button>
            </div>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    ));
  const [downloadDistricts, setDownloadDistricts] = useState(null);
  const [downloadDistrictID, setDownloadDistrictID] = useState(null);
  const handleDistrictChange = (district) => {
    setDownloadDistricts(district);
  };
  const generateDistrictReport = async () => {};
  const handleSubmitDistrict = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.districtCode || !formData.cities) {
      return toast.error("All fields are required");
    }
    if (formData.name.length < 3) {
      return toast.error("District name must be at least 3 characters");
    }
    if (formData.districtCode.length < 3) {
      return toast.error("District code must be at least 3 characters");
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/district/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("District added successfully");
        setAddDistrict(false);
        setFormData([]);
        fetchDistricts();
      } else {
        toast.error(data.message);
      }
      setIsAdding(false);
    } catch (error) {
      toast.error(error.message);
      setIsAdding(false);
    }
  };
  const handleDeleteSubmitDistrict = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/district/delete/${deleteDistrict._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("District deleted successfully");
        setDeleteModal(false);
        setDeleteDistrict(null);
        fetchDistricts();
      } else {
        toast.error(data.message);
      }
      setIsDeleting(false);
    } catch (error) {
      toast.error(error.message);
      setIsDeleting(false);
    }
  };
  const handleUpdateDistrict = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch(`/api/district/update/${updateDistrict._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("District updated successfully");
        setUpdateModal(false);
        setUpdateDistrict(null);
        fetchDistricts();
      } else {
        toast.error(data.message);
      }
      setIsAdding(false);
    } catch (error) {
      toast.error(error.message);
      setIsAdding(false);
    }
  };
  const handleReportGeneration = async () => {
    if (downloadDistricts) {
      setIsDownloading(true);
      const res = await fetch(`/api/district/downloadDistrictReport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: downloadDistricts.value }),
      });
      if (!res.ok) {
        setIsDownloading(false);
        throw new Error("Failed to generate PDF");
      }
      const pdfBlob = await res.blob();

      const url = window.URL.createObjectURL(pdfBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `District-${downloadDistricts.label}-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadDistrictID(null);
      setDownloadDistricts(null);
      setIsDownloading(false);
    }
  };
  const calculateTotalAmount = (wasteRequests) => {
    return wasteRequests.reduce(
      (total, request) => total + request.estimatedPrice,
      0
    );
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
          <div>
            <div className=" flex items-center mb-2">
              <Button
                outline
                gradientDuoTone="greenToBlue"
                className="ml-4 mr-5"
                onClick={() => handleAddDistrict()}
              >
                Add New District
              </Button>
              <TextInput
                type="text"
                placeholder="Search by district name or code"
                onChange={(e) => setSearch(e.target.value)}
                rightIcon={AiOutlineSearch}
                className="ml-1 bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mb"
              />
              <Select
                className="ml-4"
                placeholder="Select a District"
                isSearchable
                onChange={handleDistrictChange}
                isClearable
                value={downloadDistricts}
                options={selectedDistrict}
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
                disabled={!downloadDistricts || isDownloading}
                onClick={() => handleReportGeneration()}
              >
                {isDownloading ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Download District Report"
                )}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {districts.length > 0 ? (
              <Table>
                <Table.Head>
                  <Table.HeadCell>Name</Table.HeadCell>
                  <Table.HeadCell>District Code</Table.HeadCell>
                  <Table.HeadCell>Cities</Table.HeadCell>
                  <Table.HeadCell>District Active Status</Table.HeadCell>
                  <Table.HeadCell>Waste Drivers Assigned</Table.HeadCell>
                  <Table.HeadCell>Waste Requests</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Head>
                {displayDistrict}
              </Table>
            ) : (
              <p>No Districts Available</p>
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

          {/** View District Cities Modal */}
          <Modal
            show={viewCitiesModal}
            onClose={() => {
              setViewCitiesModal(false);
              setViewDistrict(null);
            }}
            size="xl"
          >
            <Modal.Header>District Cities</Modal.Header>
            <Modal.Body>
              {viewDistrict && (
                <div>
                  <p>
                    <strong>Cities: </strong>
                  </p>
                  {viewDistrict.cities && viewDistrict.cities.length > 0 ? (
                    <ul
                      style={{
                        listStyleType: "none",
                        padding: 0,
                        margin: 0,
                        maxHeight: "200px",
                        overflowY: "auto",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    >
                      {viewDistrict.cities.map((city, index) => (
                        <li
                          key={index}
                          style={{
                            padding: "10px",
                            marginBottom: "5px",
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No cities associated with this district.</p>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setViewCitiesModal(false);
                  setViewDistrict(null);
                }}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/** Add New District */}
          <Modal
            show={addDistrict}
            onClose={() => {
              setAddDistrict(false);
              setFormData({});
            }}
            size="lg"
          >
            <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New District
              </h3>
            </Modal.Header>
            <Modal.Body className="space-y-6 p-6">
              <form onSubmit={handleSubmitDistrict} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      District Name
                    </Label>
                    <TextInput
                      id="name"
                      type="text"
                      placeholder="Enter district name"
                      required
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="districtCode"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      District Code
                    </Label>
                    <TextInput
                      id="districtCode"
                      type="text"
                      placeholder="Enter district code"
                      required
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="cities"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Cities
                  </Label>
                  <Textarea
                    id="cities"
                    placeholder="Enter cities (comma-separated)"
                    required
                    onChange={handleChange}
                    rows={4}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    color="light"
                    onClick={() => {
                      setAddDistrict(false);
                      setFormData({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button color="blue" type="submit" disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      "Add District"
                    )}
                  </Button>
                </div>
              </form>
            </Modal.Body>
          </Modal>

          {/** Update District */}
          <Modal
            show={updateModal}
            onClose={() => {
              setUpdateModal(false);
              setUpdateDistrict(null);
              setFormData([]);
            }}
            size="xl"
          >
            <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update District
              </h3>
            </Modal.Header>
            <Modal.Body className="p-6">
              <form onSubmit={handleUpdateDistrict} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      District Name
                    </Label>
                    <TextInput
                      id="name"
                      type="text"
                      placeholder={updateDistrict?.name}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="districtCode"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      District Code
                    </Label>
                    <TextInput
                      id="districtCode"
                      type="text"
                      placeholder={updateDistrict?.districtCode}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label
                      htmlFor="cities"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Cities
                    </Label>
                    <Textarea
                      id="cities"
                      rows={4}
                      value={updateDistrict?.cities}
                      onChange={(e) => handleCityChange(e)}
                      className="w-full"
                      placeholder="Enter cities separated by commas"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label
                      htmlFor="status"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      District Status
                    </Label>
                    <Select
                      options={["Active", "Deactive"].map((option) => ({
                        value: option,
                        label: option,
                      }))}
                      placeholder={
                        updateDistrict?.isActive ? "Active" : "Deactive"
                      }
                      onChange={(selectedOption) =>
                        setFormData({
                          ...formData,
                          isActive: selectedOption.value,
                        })
                      }
                      isSearchable
                      id="type"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    color="failure"
                    outline
                    onClick={() => {
                      setUpdateModal(false);
                      setUpdateDistrict(null);
                      setFormData([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button color="blue" type="submit" disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      "Update District"
                    )}
                  </Button>
                </div>
              </form>
            </Modal.Body>
          </Modal>

          {/** Delete District */}
          <Modal
            show={deleteModal}
            onClose={() => {
              setDeleteModal(false), setDeleteDistrict(null);
            }}
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold">
                Are you sure you want to delete this district?
              </h3>
            </Modal.Header>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setDeleteModal(false), setDeleteDistrict(null);
                }}
              >
                Close
              </Button>
              <Button
                color="failure"
                onClick={() => handleDeleteSubmitDistrict()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner size="sm" aria-label="Loading spinner" />
                ) : (
                  "Delete District"
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/** View District Drivers Modal */}
          <Modal
            show={driverViewModal}
            onClose={() => {
              setDriverViewModal(false);
              setDriverViewDistrict(null);
            }}
            size="xl"
          >
            <Modal.Header className="bg-gray-100 p-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                District Drivers
              </h3>
            </Modal.Header>
            <Modal.Body className="p-4">
              {driverViewDistrict && (
                <div>
                  <p className="text-lg font-semibold mb-4 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Drivers:
                  </p>
                  {driverViewDistrict?.TruckDrivers &&
                  driverViewDistrict?.TruckDrivers?.length > 0 ? (
                    <ul className="space-y-4 max-h-96 overflow-y-auto">
                      {driverViewDistrict?.TruckDrivers.map((driver, index) => (
                        <li
                          key={index}
                          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 mr-2 text-blue-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                                />
                              </svg>
                              <div>
                                <p className="font-semibold text-lg">
                                  {driver?.name}
                                </p>
                                <p className="text-gray-600">
                                  NIC: {driver?.NIC}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${
                                driver?.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {driver?.isActive ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                              {driver?.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <p className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="font-medium">City:</span>{" "}
                              {driver?.city}
                            </p>
                            <p className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                                />
                              </svg>
                              <span className="font-medium">Vehicle No:</span>{" "}
                              {driver?.vehicleNumber}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 py-4 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      No drivers associated with this district.
                    </p>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="bg-gray-100 p-4">
              <Button
                color="gray"
                onClick={() => {
                  setDriverViewModal(false);
                  setDriverViewDistrict(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/** View Waste Requests Modal */}
          <Modal
            show={requestViewModal}
            onClose={() => {
              setRequestViewModal(false);
              setRequestViewDistrict(null);
            }}
            size="4xl"
          >
            <Modal.Header className="bg-blue-600 text-white text-xl font-bold py-4 px-6">
              Waste Requests for {requestViewDistrict?.name}
            </Modal.Header>
            <Modal.Body className="p-6">
              {requestViewDistrict && (
                <div className="space-y-6">
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Overview
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-lg">
                          <span className="font-semibold text-blue-600">
                            Total Requests:
                          </span>{" "}
                          {requestViewDistrict?.wasteRequests?.length || 0}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <p className="text-lg">
                          <span className="font-semibold text-blue-600">
                            Total Amount:
                          </span>{" "}
                          {calculateTotalAmount(
                            requestViewDistrict?.wasteRequests || []
                          )}{" "}
                          LKR
                        </p>
                      </div>
                    </div>
                  </div>

                  {["PENDING", "ACCEPTED", "REJECTED"].map((status) => (
                    <div key={status} className="space-y-4">
                      <h3
                        className={`text-2xl font-bold mb-4 ${
                          status === "PENDING"
                            ? "text-yellow-600"
                            : status === "ACCEPTED"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {status} Requests
                      </h3>
                      {requestViewDistrict?.wasteRequests?.filter(
                        (req) => req.requestStatus === status
                      )?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {requestViewDistrict?.wasteRequests
                            .filter((req) => req.requestStatus === status)
                            .map((request, index) => (
                              <div
                                key={index}
                                className={`p-4 rounded-lg shadow-sm ${
                                  status === "PENDING"
                                    ? "bg-yellow-50 border-l-4 border-yellow-400"
                                    : status === "ACCEPTED"
                                    ? "bg-green-50 border-l-4 border-green-400"
                                    : "bg-red-50 border-l-4 border-red-400"
                                }`}
                              >
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <p>
                                    <span className="font-semibold">
                                      Quantity:
                                    </span>{" "}
                                    {request.quantity} kg
                                  </p>
                                  <p>
                                    <span className="font-semibold">
                                      Price:
                                    </span>{" "}
                                    {request.estimatedPrice} LKR
                                  </p>
                                  <p>
                                    <span className="font-semibold">
                                      Pick-Up:
                                    </span>{" "}
                                    {new Date(
                                      request.pickUpDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p>
                                    <span className="font-semibold">City:</span>{" "}
                                    {request.city}
                                  </p>
                                  <p className="col-span-2">
                                    <span className="font-semibold">
                                      Address:
                                    </span>{" "}
                                    {request.address}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No {status.toLowerCase()} requests.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-t border-gray-200 py-4 px-6">
              <Button
                color="gray"
                onClick={() => {
                  setRequestViewModal(false);
                  setRequestViewDistrict(null);
                }}
                className="px-6 py-2"
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}
