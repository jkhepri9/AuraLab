// Mock database with default data and async simulation
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const initialPresets = [
    {
        id: "p1",
        name: "Deep Focus",
        color: "linear-gradient(135deg, #1e3a8a, #0c4a6e)",
        // NEW: Add a default image for visualization
        imageUrl: "https://images.unsplash.com/photo-1546410531-d8527a051d95?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        layers: [
            { id: "l1", name: "Alpha Waves (8Hz)", frequency: 8.0, volume: 0.7, pan: 0, waveform: "sine" },
            { id: "l2", name: "White Noise", frequency: 1500, volume: 0.3, pan: 0, waveform: "noise" },
        ],
        order: 0
    },
    {
        id: "p2",
        name: "Zen Garden",
        color: "linear-gradient(135deg, #059669, #065f46)",
        // NEW: Add a default image for visualization
        imageUrl: "https://images.unsplash.com/photo-1547926179-883a93c78096?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        layers: [
            { id: "l3", name: "Theta Waves (6Hz)", frequency: 6.0, volume: 0.5, pan: 0, waveform: "sine" },
            { id: "l4", name: "Pink Noise", frequency: 1500, volume: 0.3, pan: 0, waveform: "pink-noise" },
        ],
        order: 1
    },
    {
        id: "p3",
        name: "Oceanic Flow",
        color: "linear-gradient(135deg, #0ea5e9, #0f766e)",
        // NEW: Add a default image for visualization
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        layers: [
            { id: "l5", name: "Delta Waves (2Hz)", frequency: 2.0, volume: 0.6, pan: 0, waveform: "sine" },
        ],
        order: 2
    }
];

let presets = [...initialPresets];

export const db = {
    presets: {
        list: async () => {
            await sleep(100);
            // Sort by the 'order' property for display consistency
            return presets.sort((a, b) => a.order - b.order);
        },
        get: async (id) => {
            await sleep(100);
            return presets.find(p => p.id === id);
        },
        create: async (data) => {
            await sleep(100);
            const newPreset = {
                ...data,
                id: `p${Date.now()}`,
                color: data.color || initialPresets[0].color,
                imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1534000305147-380290196881?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                layers: data.layers || [],
                order: presets.length,
            };
            presets.push(newPreset);
            return newPreset;
        },
        update: async (id, data) => {
            await sleep(100);
            const index = presets.findIndex(p => p.id === id);
            if (index !== -1) {
                presets[index] = { ...presets[index], ...data };
                return presets[index];
            }
            return null;
        },
        delete: async (id) => {
            await sleep(100);
            presets = presets.filter(p => p.id !== id);
            return true;
        },
        reorder: async (id, direction) => {
            await sleep(50);
            const index = presets.findIndex(p => p.id === id);
            if (index === -1) return false;

            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= presets.length) return false;

            // Swap the order value
            const currentOrder = presets[index].order;
            presets[index].order = presets[targetIndex].order;
            presets[targetIndex].order = currentOrder;

            // Sort the array by the new order values to ensure the next list call is correct
            presets.sort((a, b) => a.order - b.order);

            return true;
        }
    }
};