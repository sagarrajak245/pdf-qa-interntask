import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    documentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
    }],
    title: {
        type: String,
        required: true,
    },
    messages: [messageSchema],
}, {
    timestamps: true,
});

export const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);