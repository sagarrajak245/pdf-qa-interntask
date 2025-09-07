import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    filename: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    vectorStoreId: {
        type: String,
        required: false,

    },
    chunksCount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['processing', 'ready', 'error'],
        default: 'processing',
    },
}, {
    timestamps: true,
});

export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);  