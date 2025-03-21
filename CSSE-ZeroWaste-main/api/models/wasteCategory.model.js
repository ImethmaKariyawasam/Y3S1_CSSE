import mongoose from "mongoose";

const wasteCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    pricePerKg: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
    },
    isUserPaymentRequired: {
        type: Boolean,
        default: true,
    }
});

const WasteCategory = mongoose.model("WasteCategory", wasteCategorySchema);
export default WasteCategory;