<template>
    <div class="block-section">
        <div class="block-header">
            <span class="block-title">
                <span>{{ header }}</span>
            </span>
            <div class="block-actions">
                <button 
                    v-if="code" 
                    class="p-button p-button-text p-button-rounded p-button-plain"
                    @click="copyCode"
                    type="button"
                >
                    <i class="pi pi-copy"></i>
                </button>
            </div>
        </div>
        <div class="block-content">
            <slot></slot>
            <div v-if="code && blockView === 'PREVIEW'" class="block-code">
                <pre><code>{{ code }}</code></pre>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
    header: {
        type: String,
        default: null
    },
    code: {
        type: String,
        default: null
    },
    recent: {
        type: Boolean,
        default: false
    }
});

const blockView = ref('PREVIEW');

const copyCode = async (event) => {
    if (props.code) {
        try {
            await navigator.clipboard.writeText(props.code);
            // Optionnel: ajouter un toast de confirmation
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    }
    event.preventDefault();
};
</script>

<style scoped>
.block-section {
    margin-bottom: 2rem;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
}

.block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: var(--surface-50);
    border-bottom: 1px solid var(--surface-border);
}

.block-title {
    font-weight: 600;
    color: var(--text-color);
}

.block-actions {
    display: flex;
    gap: 0.5rem;
}

.block-content {
    padding: 1rem;
}

.block-code {
    margin-top: 1rem;
    background-color: var(--surface-100);
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
}

.block-code pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
}

.block-code code {
    color: var(--text-color);
}
</style>
