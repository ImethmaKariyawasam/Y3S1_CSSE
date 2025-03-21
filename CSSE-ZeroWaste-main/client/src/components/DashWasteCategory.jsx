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
  Textarea,
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
import { GiRecycle } from "react-icons/gi";
import { set } from "mongoose";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../firebase";
export default function DashWasteCategory() {
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalActiveCategories, setTotalActiveCategories] = useState(0);
  const [totalInactiveCategories, setTotalInactiveCategories] = useState(0);
  const [Categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const fetchWasteCategories = async () => {
    try {
      const res = await fetch("/api/waste-category/get");
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      const data = await res.json();
      const selectedCategories = data.wasteCategories.map((category) => ({
        value: category._id,
        label: category.name,
      }));
      const filteredCategories = data.wasteCategories.filter((category) =>
        category.name.toLowerCase().includes(search.toLowerCase())
      );
      setSelectedCategory(selectedCategories);
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

  useEffect(() => {
    fetchWasteCategories();
  }, [search]);

  const handleImageChange = (e) => {
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
  const [itemIdToDelete, setItemIdToDelete] = useState("");
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
          setFormData({ ...formData, image: downloadURL });
        });
      }
    );
  };

  const [viewModal, setViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const handleView = (category) => {
    setViewData(category);
    setViewModal(true);
  };

  const [updateModal, setUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState(null);
  const handleUpdate = (category) => {
    setUpdateData(category);
    setUpdateModal(true);
  };

  const handleDelete = (category) => {
    setItemIdToDelete(category._id);
    setDeleteModal(true);
  };

  const [pageNumber, setPageNumber] = useState(0);
  const categoriesPerPage = 5;

  const pageCount = Math.ceil(Categories.length / categoriesPerPage);

  const handlePageChange = ({ selected }) => {
    setPageNumber(selected);
  };

  const displayCategory = Categories.slice(
    pageNumber * categoriesPerPage,
    (pageNumber + 1) * categoriesPerPage
  ).map((category) => (
    <Table.Body className="divide-y">
      <Table.Row
        key={category._id}
        className="bg-white dark:border-gray-700 dark:bg-gray-800"
      >
        <Table.Cell>{category.name}</Table.Cell>
        <Table.Cell>
          {
            <Badge
              color={
                category.isActive === true
                  ? "success"
                  : category.isActive === false
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
              {category.isActive ? (
                <FaCheckCircle color="green" size={20} /> // Checkmark icon for verified
              ) : (
                <FaTimesCircle color="red" size={20} /> // Cross icon for not verified
              )}
            </Badge>
          }
        </Table.Cell>
        <Table.Cell>
          {
            <Badge
              color={
                category.isUserPaymentRequired === true
                  ? "success"
                  : category.isUserPaymentRequired === false
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
              {category.isUserPaymentRequired ? (
                <FaCheckCircle color="green" size={20} /> // Checkmark icon for verified
              ) : (
                <FaTimesCircle color="red" size={20} /> // Cross icon for not verified
              )}
            </Badge>
          }
        </Table.Cell>
        <Table.Cell>{category.pricePerKg}</Table.Cell>
        <Table.Cell>
          <div className="flex items-center space-x-4">
            <Button
              color="green"
              type="submit"
              outline
              onClick={() => handleView(category)}
            >
              <HiEye className="mr-2 h-5 w-5" />
              View
            </Button>
            <Button
              color="green"
              type="submit"
              outline
              onClick={() => handleUpdate(category)}
            >
              <FaClipboardList className="mr-2 h-5 w-5" />
              Update
            </Button>
            <Button
              size="sm"
              color="failure"
              disabled={isDeleting}
              outline
              onClick={() => handleDelete(category)}
            >
              <HiOutlineX className="mr-2 h-5 w-5" />
              Delete
            </Button>
          </div>
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  ));

  const [downloadCategory, setDownloadCategory] = useState(null);
  const handleCategoryChange = (selectedOption) => {
    setDownloadCategory(selectedOption);
  };

  const [addModal, setAddModal] = useState(false);
  const handleAddNewCategory = () => {
    setAddModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const [isAdding, setIsAdding] = useState(false);
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/waste-category/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        throw new Error(data.message || "Something went wrong");
      }
      toast.success("Category Added Successfully");
      setImageFile(null);
      setImageFileUploadingError(false);
      setFileUploadSuccess(false);
      setImageFileUploadingProgress(false);
      fetchWasteCategories();
      setAddModal(false);
      setIsAdding(false);
    } catch (error) {
      setError(error.message);
      setIsAdding(false);
    }
  };
  const [isUpdating, setIsUpdating] = useState(false);
  const submitUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/waste-category/update/${updateData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        throw new Error(data.message || "Something went wrong");
      }
      toast.success("Category Updated Successfully");
      setImageFile(null);
      setImageFileUploadingError(false);
      setFileUploadSuccess(false);
      setImageFileUploadingProgress(false);
      fetchWasteCategories();
      setUpdateModal(false);
      setIsUpdating(false);
    } catch (error) {
      setError(error.message);
      setIsUpdating(false);
    }
  };
  const handleDeleteCategory = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/waste-category/delete/${itemIdToDelete}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        throw new Error(data.message || "Something went wrong");
      }
      toast.success("Category Deleted Successfully");
      fetchWasteCategories();
      setDeleteModal(false);
      setIsDeleting(false);
    } catch (error) {
      toast.error(error);
      setError(error.message);
      setIsDeleting(false);
    }
  };
  console.log(formData);
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
          <div>
            <div className=" flex items-center mb-2">
              <Button
                outline
                gradientDuoTone="greenToBlue"
                className="ml-4 mr-5"
                onClick={() => handleAddNewCategory()}
              >
                Add New Category
              </Button>
              <TextInput
                type="text"
                placeholder="Search by Category Name"
                onChange={(e) => setSearch(e.target.value)}
                rightIcon={AiOutlineSearch}
                className="ml-1 bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mb"
              />
              <Select
                className="ml-4"
                placeholder="Select a Waste Category"
                isSearchable
                isClearable
                options={selectedCategory}
                value={downloadCategory}
                onChange={handleCategoryChange}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    width: "300px",
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
              <Button outline gradientDuoTone="greenToBlue" className=" ml-4">
                {isDownloading ? (
                  <Spinner className="animate-spin" color="white" size="sm" />
                ) : (
                  "Download Category Report"
                )}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {Categories.length > 0 ? (
              <Table>
                <Table.Head>
                  <Table.HeadCell>Name</Table.HeadCell>
                  <Table.HeadCell>Active Status</Table.HeadCell>
                  <Table.HeadCell>User Payment</Table.HeadCell>
                  <Table.HeadCell>Price Per KG</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Head>
                {displayCategory}
              </Table>
            ) : (
              <p>No Reports Available</p>
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

          {/** Add Category Modal */}
          <Modal
            show={addModal}
            onClose={() => {
              setAddModal(false);
              setFormData({});
              setImageFile(null);
              setImageFileUploadingError(false);
              setFileUploadSuccess(false);
              setImageFileUploadingProgress(false);
            }}
            popup
            size="lg"
          >
            <Modal.Header className="bg-green-50 border-b border-green-100 px-6 py-4">
              <h3 className="text-xl font-semibold text-green-800 flex items-center">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add New Waste Category
              </h3>
            </Modal.Header>
            <Modal.Body className="px-6 py-4">
              <form onSubmit={handleCategorySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label
                      htmlFor="name"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Category Name
                    </Label>
                    <TextInput
                      type="text"
                      id="name"
                      placeholder="Enter Category Name"
                      required
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label
                      htmlFor="description"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Category Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Enter Category Description"
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="pricePerKg"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Price Per Kg
                    </Label>
                    <TextInput
                      type="number"
                      id="pricePerKg"
                      placeholder="Enter Price per Kg"
                      required
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label
                      htmlFor="categoryImage"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Category Image
                    </Label>
                    <input
                      type="file"
                      id="categoryImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      required
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {imageFileUploadingProgress > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-green-700">
                            Uploading...
                          </span>
                          <span className="text-sm font-medium text-green-700">
                            {imageFileUploadingProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${imageFileUploadingProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {imageFileUploadingError && (
                      <p className="mt-2 text-sm text-red-600">
                        {imageFileUploadingError}
                      </p>
                    )}
                    {fileUploadSuccess && (
                      <p className="mt-2 text-sm text-green-600">
                        File uploaded successfully!
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    color="gray"
                    onClick={() => {
                      setAddModal(false);
                      setFormData({});
                      setImageFile(null);
                      setImageFileUploadingError(false);
                      setFileUploadSuccess(false);
                      setImageFileUploadingProgress(false);
                    }}
                    className="px-4 py-2 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="green"
                    disabled={!fileUploadSuccess}
                    className="px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? (
                      <div className="flex items-center">
                        <Spinner
                          className="animate-spin mr-2"
                          color="white"
                          size="sm"
                        />
                        Adding...
                      </div>
                    ) : (
                      "Add Category"
                    )}
                  </Button>
                </div>
              </form>
            </Modal.Body>
          </Modal>
          {/** View More Modal */}
          <Modal
            show={viewModal}
            onClose={() => {
              setViewModal(false);
              setViewData(null);
            }}
            popup
            size="lg"
          >
            <Modal.Header className="bg-green-50 border-b border-green-100 px-6 py-4">
              <h3 className="text-xl font-semibold text-green-800 flex items-center">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Waste Category Details
              </h3>
            </Modal.Header>
            <Modal.Body className="px-6 py-4">
              {viewData && (
                <div className="space-y-6">
                  {/* Waste Category Name */}
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <p className="text-lg">
                      <strong className="font-semibold">Category Name:</strong>{" "}
                      <span className="text-gray-700">{viewData.name}</span>
                    </p>
                  </div>

                  {/* Waste Category Description */}
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 mt-1 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h7"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold mb-1">Description:</p>
                      <p className="text-gray-700">
                        {viewData.description ? viewData.description : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Waste Category Status */}
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-lg">
                      <strong className="font-semibold">Status:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          viewData.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {viewData.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                  {/**User Payment */}
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-lg">
                      <strong className="font-semibold">User Payment:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          viewData.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {viewData.isUserPaymentRequired
                          ? "Required"
                          : "Not Required"}
                      </span>
                    </p>
                  </div>
                  {/* Price Per Kg */}
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-lg">
                      <strong className="font-semibold">Price Per Kg:</strong>{" "}
                      <span className="text-gray-700">
                        {viewData.pricePerKg} LKR
                      </span>
                    </p>
                  </div>

                  {/* Waste Category Image */}
                  <div>
                    <p className="font-semibold mb-2 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Category Image:
                    </p>
                    {viewData.image ? (
                      <img
                        src={viewData.image}
                        alt="Category"
                        className="w-full max-w-md h-64 object-cover rounded-lg shadow-md"
                      />
                    ) : (
                      <p className="text-gray-500 italic">No image available</p>
                    )}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="bg-gray-50 border-t border-gray-100 px-6 py-4">
              <Button
                color="gray"
                onClick={() => {
                  setViewModal(false);
                  setViewData(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200 flex items-center"
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
          {/** Update Category Modal */}
          <Modal
            show={updateModal}
            onClose={() => {
              setUpdateModal(false);
              setUpdateData({});
              setFormData({});
              setImageFile(null);
              setImageFileUploadingError(false);
              setFileUploadSuccess(false);
              setImageFileUploadingProgress(false);
            }}
            popup
            size="lg"
          >
            <Modal.Header className="bg-blue-50 border-b border-blue-100 px-6 py-4">
              <h3 className="text-xl font-semibold text-blue-800 flex items-center">
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Update Waste Category
              </h3>
            </Modal.Header>
            <Modal.Body className="px-6 py-4">
              <form onSubmit={submitUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="isActive"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Set Active Status
                    </Label>
                    <Select
                      id="isActive"
                      options={[
                        { value: true, label: "Active" },
                        { value: false, label: "Inactive" },
                      ]}
                      onChange={(selectedOption) =>
                        setFormData({
                          ...updateData,
                          isActive: selectedOption.value,
                        })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="isActive"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Set User Payment Status
                    </Label>
                    <Select
                      id="isUserPaymentRequired"
                      options={[
                        { value: true, label: "Required" },
                        { value: false, label: "Not Required" },
                      ]}
                      onChange={(selectedOption) =>
                        setFormData({
                          ...updateData,
                          isUserPaymentRequired: selectedOption.value,
                        })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="name"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Category Name
                    </Label>
                    <TextInput
                      type="text"
                      id="name"
                      placeholder={updateData?.name || "Enter Category Name"}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label
                      htmlFor="description"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Category Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={
                        updateData?.description || "Enter Description"
                      }
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="pricePerKg"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Price Per Kg
                    </Label>
                    <TextInput
                      type="number"
                      id="pricePerKg"
                      placeholder={
                        updateData?.pricePerKg || "Enter Price per Kg"
                      }
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="categoryImage"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Category Image
                    </Label>
                    <input
                      type="file"
                      id="categoryImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {imageFileUploadingProgress && (
                      <div className="mt-2">
                        <div
                          className="bg-blue-100 rounded-full h-2.5 dark:bg-blue-500 transition-all duration-500"
                          style={{ width: `${imageFileUploadingProgress}%` }}
                        ></div>
                      </div>
                    )}
                    {imageFileUploadingError && (
                      <p className="mt-2 text-sm text-red-600">
                        {imageFileUploadingError}
                      </p>
                    )}
                    {fileUploadSuccess && (
                      <p className="mt-2 text-sm text-green-600">
                        File uploaded successfully!
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    color="gray"
                    onClick={() => {
                      setUpdateModal(false);
                      setUpdateData({});
                      setImageFile(null);
                      setFormData({});
                      setImageFileUploadingError(false);
                      setFileUploadSuccess(false);
                      setImageFileUploadingProgress(false);
                    }}
                    className="px-4 py-2 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="blue"
                    className="px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                  >
                    {isUpdating ? (
                      <div className="flex items-center">
                        <Spinner
                          className="animate-spin mr-2"
                          color="white"
                          size="sm"
                        />
                        Updating...
                      </div>
                    ) : (
                      "Update Category"
                    )}
                  </Button>
                </div>
              </form>
            </Modal.Body>
          </Modal>
          {/** Delete Category Modal */}
          <Modal
            show={deleteModal}
            onClose={() => {
              setDeleteModal(false), setItemIdToDelete(null);
            }}
          >
            <Modal.Header>
              <h3 className="text-xl font-semibold">
                Are you sure you want to delete this Category?
              </h3>
            </Modal.Header>
            <Modal.Footer>
              <Button
                color="gray"
                onClick={() => {
                  setDeleteModal(false), setItemIdToDelete(null);
                }}
              >
                Close
              </Button>
              <Button
                color="failure"
                onClick={() => handleDeleteCategory()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner size="sm" aria-label="Loading spinner" />
                ) : (
                  "Delete Category"
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}
