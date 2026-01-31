import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaPlus,
  FaArrowLeft,
  FaHome,
  FaBuilding,
  FaMapPin,
  FaCheck,
} from "react-icons/fa";
import { HiLocationMarker } from "react-icons/hi";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const staticTexts = [
  "Saved Addresses",
  "Add New",
  "Edit Address",
  "Add New Address",
  "Address Type",
  "Home",
  "Office",
  "Other",
  "Label",
  "e.g., Home, Office",
  "Address",
  "Street address, building, house no.",
  "City",
  "State",
  "Pincode",
  "Landmark (Optional)",
  "Nearby landmark",
  "Set as default address",
  "Cancel",
  "Save Address",
  "No saved addresses",
  "Add your first address to get started",
  "Are you sure you want to delete this address?",
  "Please fill all required fields",
];

const SavedAddressesPage = () => {
  const navigate = useNavigate();
  const { getTranslatedText } = usePageTranslation(staticTexts);
  /* Addresses state - initialized empty as per requirement */
  const [addresses, setAddresses] = useState([]);

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    type: "home",
    isDefault: false,
  });

  const addressTypes = [
    { value: "home", label: getTranslatedText("Home"), icon: FaHome },
    { value: "office", label: getTranslatedText("Office"), icon: FaBuilding },
    { value: "other", label: getTranslatedText("Other"), icon: FaMapPin },
  ];

  const handleAddNew = () => {
    setIsAddMode(true);
    setEditingId(null);
    setFormData({
      label: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      type: "home",
      isDefault: false,
    });
  };

  const handleEdit = (address) => {
    setEditingId(address.id);
    setIsAddMode(false);
    setFormData({ ...address });
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        getTranslatedText("Are you sure you want to delete this address?")
      )
    ) {
      setAddresses(addresses.filter((addr) => addr.id !== id));
    }
  };

  const handleSave = () => {
    if (
      !formData.label ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      alert(getTranslatedText("Please fill all required fields"));
      return;
    }

    if (editingId) {
      // Update existing address
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingId ? { ...formData, id: editingId } : addr
        )
      );
      setEditingId(null);
    } else {
      // Add new address
      const newAddress = {
        ...formData,
        id: Date.now(),
      };
      setAddresses([...addresses, newAddress]);
      setIsAddMode(false);
    }

    // Reset form
    setFormData({
      label: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      type: "home",
      isDefault: false,
    });
  };

  const handleCancel = () => {
    setIsAddMode(false);
    setEditingId(null);
    setFormData({
      label: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      type: "home",
      isDefault: false,
    });
  };

  const handleSetDefault = (id) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-20 md:pb-0"
      style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}>
      <div
        className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6"
        style={{ background: "transparent" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:opacity-70 transition-opacity bg-white/20 backdrop-blur-sm shadow-sm"
              style={{ color: "#ffffff" }}>
              <FaArrowLeft size={20} />
            </button>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: "#ffffff" }}>
              {getTranslatedText("Saved Addresses")}
            </h1>
          </div>
          {!isAddMode && !editingId && (
            <motion.button
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm md:text-base text-white transition-all shadow-md hover:shadow-lg hover:bg-emerald-600"
              style={{ backgroundColor: "#059669" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#047857")}
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "#059669")
              }>
              <FaPlus size={16} />
              <span className="hidden md:inline">
                {getTranslatedText("Add New")}
              </span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Add/Edit Form */}
        <AnimatePresence>
          {(isAddMode || editingId) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6">
              <div
                className="rounded-2xl p-4 md:p-6 shadow-lg backdrop-blur-sm"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
                <h2
                  className="text-lg md:text-xl font-bold mb-4"
                  style={{ color: "#1e293b" }}>
                  {editingId
                    ? getTranslatedText("Edit Address")
                    : getTranslatedText("Add New Address")}
                </h2>

                <div className="space-y-4">
                  {/* Address Type */}
                  <div>
                    <label
                      className="block text-xs md:text-sm font-medium mb-2"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Address Type")}
                    </label>
                    <div className="flex gap-2 md:gap-3">
                      {addressTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() =>
                              setFormData({ ...formData, type: type.value })
                            }
                            className={`flex-1 flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all ${formData.type === type.value
                              ? "border-emerald-500 bg-emerald-50/50"
                              : "border-slate-200 hover:bg-slate-50"
                              }`}
                            style={{
                              backgroundColor:
                                formData.type === type.value
                                  ? "#ecfdf5"
                                  : "#ffffff",
                            }}>
                            <IconComponent
                              size={20}
                              style={{
                                color:
                                  formData.type === type.value
                                    ? "#059669"
                                    : "#64748b",
                              }}
                            />
                            <span
                              className="text-xs md:text-sm font-medium"
                              style={{
                                color:
                                  formData.type === type.value
                                    ? "#059669"
                                    : "#64748b",
                              }}>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Label */}
                  <div>
                    <label
                      className="block text-xs md:text-sm font-medium mb-1.5"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Label")}{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) =>
                        setFormData({ ...formData, label: e.target.value })
                      }
                      placeholder={getTranslatedText("e.g., Home, Office")}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      style={{
                        borderColor: "#e2e8f0",
                        color: "#1e293b",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label
                      className="block text-xs md:text-sm font-medium mb-1.5"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Address")}{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder={getTranslatedText(
                        "Street address, building, house no."
                      )}
                      rows={3}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base border transition-all focus:outline-none resize-none focus:ring-2 focus:ring-emerald-500/20"
                      style={{
                        borderColor: "#e2e8f0",
                        color: "#1e293b",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </div>

                  {/* City and State */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-xs md:text-sm font-medium mb-1.5"
                        style={{ color: "#475569" }}>
                        {getTranslatedText("City")}{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder={getTranslatedText("City")}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{
                          borderColor: "#e2e8f0",
                          color: "#1e293b",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs md:text-sm font-medium mb-1.5"
                        style={{ color: "#475569" }}>
                        {getTranslatedText("State")}{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        placeholder={getTranslatedText("State")}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{
                          borderColor: "#e2e8f0",
                          color: "#1e293b",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </div>
                  </div>

                  {/* Pincode and Landmark */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-xs md:text-sm font-medium mb-1.5"
                        style={{ color: "#475569" }}>
                        {getTranslatedText("Pincode")}{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pincode: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          })
                        }
                        placeholder={getTranslatedText("Pincode")}
                        maxLength={6}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{
                          borderColor: "#e2e8f0",
                          color: "#1e293b",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs md:text-sm font-medium mb-1.5"
                        style={{ color: "#475569" }}>
                        {getTranslatedText("Landmark (Optional)")}
                      </label>
                      <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) =>
                          setFormData({ ...formData, landmark: e.target.value })
                        }
                        placeholder={getTranslatedText("Nearby landmark")}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{
                          borderColor: "#e2e8f0",
                          color: "#1e293b",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </div>
                  </div>

                  {/* Set as Default */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isDefault: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-2"
                      style={{
                        accentColor: "#059669",
                        borderColor: formData.isDefault ? "#059669" : "#e2e8f0",
                      }}
                    />
                    <label
                      htmlFor="isDefault"
                      className="text-sm md:text-base cursor-pointer"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Set as default address")}
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2.5 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all hover:bg-slate-50"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        color: "#64748b",
                      }}
                    >
                      {getTranslatedText("Cancel")}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-2.5 md:py-3 px-4 rounded-lg font-semibold text-sm md:text-base text-white transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:bg-emerald-600"
                      style={{ backgroundColor: "#059669" }}
                    >
                      <FaCheck size={14} />
                      {getTranslatedText("Save Address")}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Addresses List */}
        <div className="space-y-3 md:space-y-4">
          {addresses.length === 0 && !isAddMode && !editingId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 md:p-12 text-center shadow-lg backdrop-blur-sm"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
              <HiLocationMarker
                size={48}
                className="mx-auto mb-4"
                style={{ color: "#94a3b8" }}
              />
              <h3
                className="text-lg md:text-xl font-bold mb-2"
                style={{ color: "#1e293b" }}>
                {getTranslatedText("No saved addresses")}
              </h3>
              <p
                className="text-sm md:text-base mb-4"
                style={{ color: "#64748b" }}>
                {getTranslatedText("Add your first address to get started")}
              </p>
              <button
                onClick={handleAddNew}
                className="px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg hover:bg-emerald-600"
                style={{ backgroundColor: "#059669" }}>
                <FaPlus className="inline mr-2" />
                Add Address
              </button>
            </motion.div>
          ) : (
            addresses.map((address, index) => {
              const TypeIcon =
                addressTypes.find((t) => t.value === address.type)?.icon ||
                FaMapPin;
              return (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: address.isDefault
                      ? "2px solid #10b981"
                      : "1px solid #e2e8f0",
                  }}>
                  <div className="flex items-start gap-3 md:gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                      }}>
                      <TypeIcon size={20} />
                    </div>

                    {/* Address Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className="font-bold text-base md:text-lg"
                              style={{ color: "#1e293b" }}>
                              {address.label}
                            </h3>
                            {address.isDefault && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  backgroundColor: "#d1fae5",
                                  color: "#047857",
                                }}>
                                Default
                              </span>
                            )}
                          </div>
                          <p
                            className="text-sm md:text-base mb-1"
                            style={{ color: "#475569" }}>
                            {address.address}
                          </p>
                          <p
                            className="text-sm md:text-base mb-1"
                            style={{ color: "#64748b" }}>
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          {address.landmark && (
                            <p
                              className="text-xs md:text-sm"
                              style={{ color: "#94a3b8" }}>
                              Near {address.landmark}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address.id)}
                            className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all hover:bg-emerald-50"
                            style={{
                              backgroundColor: "transparent",
                              border: "1px solid #10b981",
                              color: "#059669",
                            }}
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(address)}
                          className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1 hover:bg-slate-50"
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid #cbd5e1",
                            color: "#475569",
                          }}
                        >
                          <FaEdit size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(address.id)}
                          className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1 hover:bg-red-50"
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid #fecaca",
                            color: "#ef4444",
                          }}
                        >
                          <FaTrash size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SavedAddressesPage;
