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
  FaTruck,
} from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import { RiGovernmentLine } from "react-icons/ri";
import Select from "react-select";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../firebase";
import { set } from "mongoose";
import ReactSelect from "react-select";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Truck,
  MapPin,
  Image,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  ToggleLeft 
} from "lucide-react";
export default function DashWasteDrivers() {
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [driverAddModal, setDriverAddModal] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState([]);
  const [district, setDistrict] = useState(null);
  const [cities, setCities] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalActiveDrivers, setTotalActiveDrivers] = useState(0);
  const [totalInactiveDrivers, setTotalInactiveDrivers] = useState(0);
  const [selectDistricts, setSelectDistricts] = useState([]);
  const [selectCity, setSelectCity] = useState([]);
  const [downloadDistrict, setDownloadDistrict] = useState(null);
  const [downloadCity, setDownloadCity] = useState(null);
  const handleDistrictChange = (selectedOption) => {
    setSelectedDistrict(selectedOption || ""); // Set the selected district
    setFormData({ ...formData, district: selectedOption?._id || "" }); // Update the form data with the selected district
    const relevantCities = selectedOption?.cities || []; // Extract cities from selected district
    setCities(relevantCities); // Update the cities state
  };

  const handleDownalodDistrict = (selectedOption) => {
    setDownloadDistrict(selectedOption || "");
  };
  const handleCityChange = (selectedOption) => {
    setDownloadCity(selectedOption || "");
  };
  const handleDownload = async () => {
    if (downloadDistrict !== null) {
      setIsDownloading(true);
      try {
        const res = await fetch("/api/waste-truck/generate-district-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: downloadDistrict.value }),
        });
        if (!res.ok) {
          throw new Error("Failed to generate PDF");
        }
        const pdfBlob = await res.blob();

        const url = window.URL.createObjectURL(pdfBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `District_Report_${downloadDistrict.label}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsDownloading(false);
        setDownloadDistrict(null);
      } catch (error) {
        isDownloading(false);
        setDownloadDistrict(null);
        console.log(error);
        toast.error(error.message);
      }
    }
    if (downloadCity !== null) {
      setIsDownloading(true);
      try {
        const res = await fetch("/api/waste-truck/generate-district-report", {
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
  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/waste-truck/get");
      const data = await res.json();
      if (res.ok) {
        const filteredDrivers = data.drivers.filter(
          (driver) =>
            driver.name.toLowerCase().includes(search.toLowerCase()) ||
            driver.email.toLowerCase().includes(search.toLowerCase())
        );
        const uniqueDistricts = [
          ...new Set(data.drivers.map((driver) => driver.district)),
        ];
        const uniqueCities = [
          ...new Set(data.drivers.map((driver) => driver.city)),
        ];
        setSelectCity(uniqueCities);
        setSelectDistricts(uniqueDistricts);
        setDrivers(filteredDrivers);
        setTotalDrivers(data.totalDrivers);
        setTotalActiveDrivers(data.totalActiveDrivers);
        setTotalInactiveDrivers(data.totalInactiveDrivers);
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
    fetchDrivers();
  }, [search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const [vehicleImageFile, setVehicleImageFile] = useState(null);
  const handleVehicleImageChange = (e) => {
    setVehicleImageFile(e.target.files[0]);
  };

  useEffect(() => {
    if (vehicleImageFile) {
      uploadVehicleImage();
    }
  }, [vehicleImageFile]);
  const [
    Vehicle_imageFileUploadingProgress,
    setVehicle_ImageFileUploadingProgress,
  ] = useState(null);
  const [Vehicle_imageFileUploadingError, setVehicle_ImageFileUploadingError] =
    useState(null);
  const [Vehicle_fileUploadSuccess, setVehicle_FileUploadSuccess] =
    useState(false);
  const [Vehicle_imageFileUrl, setVehicle_ImageFileUrl] = useState(null);
  const [Vehicle_itemIdToDelete, setVehicle_ItemIdToDelete] = useState("");
  const uploadVehicleImage = async () => {
    const storage = getStorage(app);
    const filename = new Date().getTime() + vehicleImageFile.name;
    const storageRef = ref(storage, filename);
    const uploadTask = uploadBytesResumable(storageRef, vehicleImageFile);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setVehicle_ImageFileUploadingProgress(progress.toFixed(0));
        setVehicle_FileUploadSuccess("File Uploaded Successfully");
      },
      (error) => {
        setVehicle_ImageFileUploadingError(
          "Could not upload image(File must be less than 2MB)"
        );
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setVehicle_ImageFileUrl(downloadURL);
          setFormData({ ...formData, vehicleImage: downloadURL });
        });
      }
    );
  };

  const handleDriverImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  useEffect(() => {
    if (imageFile) {
      uploadDriverImage();
    }
  }, [imageFile]);
  const [imageFileUploadingProgress, setImageFileUploadingProgress] =
    useState(null);
  const [imageFileUploadingError, setImageFileUploadingError] = useState(null);
  const [fileUploadSuccess, setFileUploadSuccess] = useState(false);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const uploadDriverImage = async () => {
    const storage = getStorage(app);
    const filename = new Date().getTime() + imageFile.name;
    const storageRef = ref(storage, filename);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageFileUploadingProgress(progress.toFixed(0));
        setFileUploadSuccess("File Uploaded Successfully");
      },
      (error) => {
        setImageFileUploadingError(
          "Could not upload image(File must be less than 2MB)"
        );
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageFileUrl(downloadURL);
          setFormData({ ...formData, DriverImage: downloadURL });
        });
      }
    );
  };
  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/waste-truck/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Driver Added Successfully");
        fetchDrivers();
        setIsAdding(false);
        setDriverAddModal(false);
        setFormData({});
        setImageFile(null);
        setVehicleImageFile(null);
        setImageFileUploadingError(false);
        setFileUploadSuccess(false);
        setImageFileUploadingProgress(false);
        setVehicle_ImageFileUploadingError(false);
        setVehicle_FileUploadSuccess(false);
        setVehicle_ImageFileUploadingProgress(false);
      } else {
        setIsAdding(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsAdding(false);
      toast.error(error.message);
    }
  };

  const [updateModal, setUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState(null);
  const handleDriverUpdate = (driver) => {
    setUpdateData(driver);
    setUpdateModal(true);
  };

  const [viewModal, setViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const handleDriverView = (driver) => {
    setViewData(driver);
    setViewModal(true);
  };

  const [deleteDriver, setDeleteDriver] = useState(null);
  const handleDelete = (driver) => {
    setDeleteDriver(driver);
    setDeleteModal(true);
  };

  const [pageNumber, setPageNumber] = useState(0);
  const driversPerPage = 5;

  const pageCount = Math.ceil(drivers.length / driversPerPage);

  const handlePageChange = ({ selected }) => {
    setPageNumber(selected);
  };

  const displayDrivers = drivers
    .slice(pageNumber * driversPerPage, (pageNumber + 1) * driversPerPage)
    .map((driver) => (
      <Table.Body className="divide-y">
        <Table.Row
          key={driver._id}
          className="bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          <Table.Cell>{driver.name}</Table.Cell>
          <Table.Cell>{driver.email}</Table.Cell>
          <Table.Cell>{driver.phone}</Table.Cell>
          <Table.Cell>
            {
              <Badge
                color={
                  driver.isActive === true
                    ? "success"
                    : driver.isActive === false
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
                {driver.isActive ? (
                  <FaCheckCircle color="green" size={20} /> // Checkmark icon for verified
                ) : (
                  <FaTimesCircle color="red" size={20} /> // Cross icon for not verified
                )}
              </Badge>
            }
          </Table.Cell>
          <Table.Cell>
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                color="gray"
                onClick={() => handleDriverView(driver)}
              >
                <HiEye className="mr-2 h-5 w-5" />
                View
              </Button>
              <Button
                color="green"
                type="submit"
                outline
                onClick={() => handleDriverUpdate(driver)}
              >
                <FaClipboardList className="mr-2 h-5 w-5" />
                Update
              </Button>
              <Button
                size="sm"
                color="failure"
                disabled={isDeleting}
                outline
                onClick={() => handleDelete(driver)}
              >
                <HiOutlineX className="mr-2 h-5 w-5" />
                Delete
              </Button>
            </div>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    ));
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/waste-truck/update/${updateData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Driver Updated Successfully");
        fetchDistricts();
        fetchDrivers();
        setIsUpdating(false);
        setUpdateModal(false);
        setFormData({});
        setImageFile(null);
        setVehicleImageFile(null);
        setImageFileUploadingError(false);
        setFileUploadSuccess(false);
        setImageFileUploadingProgress(false);
        setVehicle_ImageFileUploadingError(false);
        setVehicle_FileUploadSuccess(false);
        setVehicle_ImageFileUploadingProgress(false);
      } else {
        setIsUpdating(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsUpdating(false);
      toast.error(error.message);
    }
  };
  const handleDeleteSubmitDriver = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/waste-truck/delete/${deleteDriver._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Driver Deleted Successfully");
        fetchDistricts();
        fetchDrivers();
        setIsDeleting(false);
        setDeleteModal(false);
      } else {
        setIsDeleting(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsDeleting(false);
      toast.error(error.message);
    }
  };
  const resetForm = () => {
    setDriverAddModal(false);
    setUpdateModal(false);
    setFormData({});
    setImageFile(null);
    setVehicleImageFile(null);
    setImageFileUploadingError(false);
    setFileUploadSuccess(false);
    setImageFileUploadingProgress(false);
    setVehicle_ImageFileUploadingError(false);
    setVehicle_FileUploadSuccess(false);
    setVehicle_ImageFileUploadingProgress(false);
    setCities([]);
  };

  const uniqueDistricts = Array.from(
    new Map(
      selectDistricts.map((district) => [district._id, district])
    ).values()
  );

  const uniqueCities = Array.from(
    new Map(selectCity.map((city) => [city, city])).values()
  );

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
                      Total Waste Drucks
                    </h3>
                    <p className="text-2xl">{totalDrivers}</p>
                  </div>
                  <FaTruck className="bg-yellow-500 text-white  text-5xl p-3 shadow-lg" />
                </div>
              </div>
              <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                <div className="flex justify-between">
                  <div className="">
                    <h3 className="text-gray-500 text-md uppercase">
                      Active Waste Trucks
                    </h3>
                    <p className="text-2xl">{totalActiveDrivers}</p>
                  </div>
                  <FaTruck className="bg-green-500 text-white  text-5xl p-3 shadow-lg" />
                </div>
              </div>
              <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
                <div className="flex justify-between">
                  <div className="">
                    <h3 className="text-gray-500 text-md uppercase">
                      Inactive Waste Trucks
                    </h3>
                    <p className="text-2xl">{totalInactiveDrivers}</p>
                  </div>
                  <FaTruck className="bg-red-500 text-white text-5xl p-3 shadow-lg" />
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
                onClick={() => setDriverAddModal(true)}
              >
                Add New Driver
              </Button>
              <TextInput
                type="text"
                placeholder="Search by driver name or email"
                onChange={(e) => setSearch(e.target.value)}
                rightIcon={AiOutlineSearch}
                className="ml-1 bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mb"
              />
              <Select
                className="ml-4"
                placeholder="Select a district"
                isSearchable
                options={uniqueDistricts.map((district) => ({
                  value: district._id,
                  label: district.name,
                }))}
                onChange={handleDownalodDistrict}
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
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Download Driver Report"
                )}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {drivers.length > 0 ? (
              <Table>
                <Table.Head>
                  <Table.HeadCell>Name</Table.HeadCell>
                  <Table.HeadCell>Email</Table.HeadCell>
                  <Table.HeadCell>Phone No</Table.HeadCell>
                  <Table.HeadCell>Active Status</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Head>
                {displayDrivers}
              </Table>
            ) : (
              <p>No Drivers Available</p>
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

          {/** Add Driver */}
          <Modal show={driverAddModal} onClose={resetForm} size="4xl">
            <Modal.Header>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <User className="mr-2" /> Add New Driver
              </h3>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={handleDriverSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="name" className="flex items-center mb-2">
                      <User className="mr-2" /> Driver Name
                    </Label>
                    <TextInput
                      type="text"
                      id="name"
                      placeholder="Enter Driver Name"
                      required
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center mb-2">
                      <Mail className="mr-2" /> Driver Email
                    </Label>
                    <TextInput
                      type="email"
                      id="email"
                      placeholder="Enter Driver Email"
                      required
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center mb-2">
                      <Phone className="mr-2" /> Driver Phone
                    </Label>
                    <TextInput
                      type="text"
                      id="phone"
                      placeholder="Enter Driver Phone"
                      required
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="NIC" className="flex items-center mb-2">
                      <CreditCard className="mr-2" /> NIC
                    </Label>
                    <TextInput
                      type="text"
                      id="NIC"
                      placeholder="Enter Driver NIC"
                      required
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="vehicleNumber"
                      className="flex items-center mb-2"
                    >
                      <Truck className="mr-2" /> Vehicle Number
                    </Label>
                    <TextInput
                      type="text"
                      id="vehicleNumber"
                      placeholder="Enter Vehicle Number"
                      required
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="district"
                      className="flex items-center mb-2"
                    >
                      <MapPin className="mr-2" /> District
                    </Label>
                    <ReactSelect
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
                  <div>
                    <Label
                      htmlFor="driverImage"
                      className="flex items-center mb-2"
                    >
                      <Image className="mr-2" /> Driver Image
                    </Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDriverImageChange}
                      required
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    />
                    {imageFileUploadingProgress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${imageFileUploadingProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {imageFileUploadingError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {imageFileUploadingError}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="vehicleImage"
                      className="flex items-center mb-2"
                    >
                      <Image className="mr-2" /> Vehicle Image
                    </Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVehicleImageChange}
                      required
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    />
                    {Vehicle_imageFileUploadingProgress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{
                              width: `${Vehicle_imageFileUploadingProgress}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {Vehicle_imageFileUploadingError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {Vehicle_imageFileUploadingError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    type="submit"
                    color="success"
                    disabled={!Vehicle_fileUploadSuccess || !fileUploadSuccess}
                  >
                    {isAdding ? (
                      <Spinner className="mr-2 animate-spin" size="sm" />
                    ) : (
                      <User className="mr-2" />
                    )}
                    {isAdding ? "Adding..." : "Add Driver"}
                  </Button>
                  <Button color="gray" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Modal.Body>
          </Modal>
          {/** View Modal */}
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
                <User className="mr-2" /> Driver Details
              </h2>
            </Modal.Header>
            <Modal.Body>
              {viewData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-xl font-semibold mb-4">
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        <p className="flex items-center">
                          <User className="mr-2 text-gray-600" size={18} />
                          <strong>Name:</strong>{" "}
                          <span className="ml-1">{viewData?.name}</span>
                        </p>
                        <p className="flex items-center">
                          <Mail className="mr-2 text-gray-600" size={18} />
                          <strong>Email:</strong>{" "}
                          <span className="ml-1">{viewData?.email}</span>
                        </p>
                        <p className="flex items-center">
                          <Phone className="mr-2 text-gray-600" size={18} />
                          <strong>Phone:</strong>{" "}
                          <span className="ml-1">{viewData?.phone}</span>
                        </p>
                        <p className="flex items-center">
                          <CreditCard
                            className="mr-2 text-gray-600"
                            size={18}
                          />
                          <strong>NIC:</strong>{" "}
                          <span className="ml-1">{viewData?.NIC}</span>
                        </p>
                        <p className="flex items-center">
                          <Truck className="mr-2 text-gray-600" size={18} />
                          <strong>Vehicle Number:</strong>{" "}
                          <span className="ml-1">
                            {viewData?.vehicleNumber}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <MapPin className="mr-2 text-gray-600" size={18} />
                          <strong>City:</strong>{" "}
                          <span className="ml-1">{viewData?.city}</span>
                        </p>
                        <p className="flex items-center">
                          <MapPin className="mr-2 text-gray-600" size={18} />
                          <strong>District:</strong>{" "}
                          <span className="ml-1">
                            {viewData?.district?.name || "No district assigned"}
                          </span>
                        </p>
                        <p className="flex items-center">
                          <CheckCircle
                            className={`mr-2 ${
                              viewData?.isActive
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                            size={18}
                          />
                          <strong>Status:</strong>
                          <span
                            className={`ml-1 font-semibold ${
                              viewData?.isActive
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {viewData?.isActive ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-xl font-semibold mb-4">Images</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="flex items-center mb-2">
                            <Image className="mr-2 text-gray-600" size={18} />
                            <strong>Driver Image:</strong>
                          </p>
                          <img
                            src={viewData?.DriverImage}
                            alt="Driver"
                            className="w-32 h-32 object-cover rounded-lg shadow"
                          />
                        </div>
                        <div>
                          <p className="flex items-center mb-2">
                            <Image className="mr-2 text-gray-600" size={18} />
                            <strong>Vehicle Image:</strong>
                          </p>
                          <img
                            src={viewData?.vehicleImage}
                            alt="Vehicle"
                            className="w-32 h-32 object-cover rounded-lg shadow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Package className="mr-2" /> Waste Requests
                    </h3>
                    {viewData?.wasteRequests &&
                    viewData?.wasteRequests.length > 0 ? (
                      <ul className="space-y-4">
                        {viewData?.wasteRequests.map((request, index) => (
                          <li
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="flex items-center">
                                  <AlertCircle
                                    className={`mr-2 ${
                                      request.requestStatus === "PENDING"
                                        ? "text-yellow-500"
                                        : request.requestStatus === "ACCEPTED"
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                    size={18}
                                  />
                                  <strong>Acceptance Status:</strong>
                                  <span
                                    className={`ml-1 font-semibold ${
                                      request.requestStatus === "PENDING"
                                        ? "text-yellow-500"
                                        : request.requestStatus === "ACCEPTED"
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {request.requestStatus}
                                  </span>
                                </p>
                                <p className="flex items-center mt-2">
                                  <AlertCircle
                                    className={`mr-2 ${
                                      request.truckDriverStatus === "PENDING"
                                        ? "text-yellow-500"
                                        : request.truckDriverStatus ===
                                          "ACCEPTED"
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                    size={18}
                                  />
                                  <strong>Driver Acceptance Status:</strong>
                                  <span
                                    className={`ml-1 font-semibold ${
                                      request.truckDriverStatus === "PENDING"
                                        ? "text-yellow-500"
                                        : request.truckDriverStatus ===
                                          "ACCEPTED"
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {request.truckDriverStatus}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <p className="flex items-center">
                                  <Package
                                    className="mr-2 text-gray-600"
                                    size={18}
                                  />
                                  <strong>Type of Waste:</strong>{" "}
                                  <span className="ml-1">
                                    {request.wasteCategory?.name}
                                  </span>
                                </p>
                                <p className="flex items-center mt-2">
                                  <Package
                                    className="mr-2 text-gray-600"
                                    size={18}
                                  />
                                  <strong>Quantity:</strong>{" "}
                                  <span className="ml-1">
                                    {request.quantity} kg
                                  </span>
                                </p>
                                <p className="flex items-center mt-2">
                                  <MapPin
                                    className="mr-2 text-gray-600"
                                    size={18}
                                  />
                                  <strong>Address:</strong>{" "}
                                  <span className="ml-1">
                                    {request.address}
                                  </span>
                                </p>
                                <p className="flex items-center mt-2">
                                  <MapPin
                                    className="mr-2 text-gray-600"
                                    size={18}
                                  />
                                  <strong>City:</strong>{" "}
                                  <span className="ml-1">{request.city}</span>
                                </p>
                                <p className="flex items-center mt-2">
                                  <MapPin
                                    className="mr-2 text-gray-600"
                                    size={18}
                                  />
                                  <strong>Location:</strong>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${request.location.coordinates[1]},${request.location.coordinates[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 text-blue-500 hover:underline"
                                  >
                                    View on Map
                                  </a>
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">
                        No waste requests associated with this driver.
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
          {/** Update Modal */}
          <Modal show={updateModal} onClose={resetForm} size="4xl">
            <Modal.Header>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <User className="mr-2" /> Update Driver
              </h3>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label
                      htmlFor="driverStatus"
                      className="flex items-center mb-2"
                    >
                      <ToggleLeft className="mr-2" /> Driver Status
                    </Label>
                    <ReactSelect
                      options={[
                        { value: true, label: "Active" },
                        { value: false, label: "Deactive" },
                      ]}
                      id="driverStatus"
                      placeholder={updateData?.isActive ? "Active" : "Deactive"}
                      onChange={(selectedOption) =>
                        setFormData({
                          ...formData,
                          isActive: selectedOption.value,
                        })
                      }
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name" className="flex items-center mb-2">
                      <User className="mr-2" /> Driver Name
                    </Label>
                    <TextInput
                      type="text"
                      id="name"
                      placeholder={updateData?.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center mb-2">
                      <Mail className="mr-2" /> Driver Email
                    </Label>
                    <TextInput
                      type="email"
                      id="email"
                      placeholder={updateData?.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center mb-2">
                      <Phone className="mr-2" /> Driver Phone
                    </Label>
                    <TextInput
                      type="text"
                      id="phone"
                      placeholder={updateData?.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="NIC" className="flex items-center mb-2">
                      <CreditCard className="mr-2" /> NIC
                    </Label>
                    <TextInput
                      type="text"
                      id="NIC"
                      placeholder={updateData?.NIC}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="vehicleNumber"
                      className="flex items-center mb-2"
                    >
                      <Truck className="mr-2" /> Vehicle Number
                    </Label>
                    <TextInput
                      type="text"
                      id="vehicleNumber"
                      placeholder={updateData?.vehicleNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="district"
                      className="flex items-center mb-2"
                    >
                      <MapPin className="mr-2" /> District
                    </Label>
                    <ReactSelect
                      options={districts}
                      id="district"
                      isClearable
                      isSearchable
                      placeholder={updateData?.district?.name}
                      getOptionLabel={(district) => district.name}
                      getOptionValue={(district) => district.id}
                      onChange={handleDistrictChange}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="flex items-center mb-2">
                      <MapPin className="mr-2" /> City
                    </Label>
                    <select
                      id="city"
                      name="city"
                      placeholder={updateData?.city}
                      onChange={handleChange}
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
                  <div>
                    <Label
                      htmlFor="driverImage"
                      className="flex items-center mb-2"
                    >
                      <Image className="mr-2" /> Driver Image
                    </Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDriverImageChange}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    />
                    {imageFileUploadingProgress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${imageFileUploadingProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {imageFileUploadingError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {imageFileUploadingError}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="vehicleImage"
                      className="flex items-center mb-2"
                    >
                      <Image className="mr-2" /> Vehicle Image
                    </Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVehicleImageChange}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    />
                    {Vehicle_imageFileUploadingProgress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{
                              width: `${Vehicle_imageFileUploadingProgress}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {Vehicle_imageFileUploadingError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {Vehicle_imageFileUploadingError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <Button type="submit" color="success">
                    {isUpdating ? (
                      <Spinner className="mr-2 animate-spin" size="sm" />
                    ) : (
                      <User className="mr-2" />
                    )}
                    {isUpdating ? "Updating..." : "Update Driver"}
                  </Button>
                  <Button color="gray" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Modal.Body>
          </Modal>
          {/** Delete Report Modal */}
          <Modal
            show={deleteModal}
            onClose={() => {
              setDeleteModal(false), setDeleteDriver(null);
            }}
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold">
                Are you sure you want to delete this driver?
              </h3>
            </Modal.Header>
            <Modal.Footer>
              <Button
                color="gray"
                onClose={() => {
                  setDeleteModal(false), setDeleteDriver(null);
                }}
              >
                Close
              </Button>
              <Button
                color="failure"
                onClick={() => handleDeleteSubmitDriver()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner size="sm" aria-label="Loading spinner" />
                ) : (
                  "Delete Driver"
                )}
              </Button>
            </Modal.Footer>
          </Modal>
          {/** Verify Modal */}
        </>
      )}
    </div>
  );
}
