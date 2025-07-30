<script setup>
import { ref, onMounted, watch } from 'vue';

const content = ref({});
const newMail = ref({});

const emit = defineEmits(['save', 'update:dialogVisible']);
const props = defineProps({
    dialogVisible: {
        type: Boolean,
        default: false
    },
    mailDetail: {
        type: Object,
        default: null
    }
});

const displayMessage = ref(false);
const localDialogVisible = ref(false);

onMounted(() => {
    updateContent();
});

watch(
    () => props.mailDetail,
    () => {
        updateContent();
    }
);

const updateContent = () => {
    content.value = { ...props.mailDetail };
};

const sendMail = () => {
    const replyMail = setMailAction();

    emit('save', replyMail);
};

const setMailAction = () => {
    return {
        ...content.value,
        ...newMail.value,
        id: generateId(),
        to: props.mailDetail.to || props.mailDetail.from,
        sent: true,
        archived: false,
        trash: false,
        spam: false,
        starred: false,
        important: false,
        date: generateDate()
    };
};

const toggleMessage = () => {
    displayMessage.value = !displayMessage.value;
};

const generateId = () => {
    let text = '';
    let possible = '0123456789';

    for (let i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

const generateDate = () => {
    return new Date().toDateString().split(' ').slice(1, 4).join(' ');
};
watch(
    () => props.dialogVisible,
    (newValue) => {
        localDialogVisible.value = newValue;
    }
);
watch(
    () => localDialogVisible.value,
    (newValue) => {
        emit('update:dialogVisible', newValue);
    }
);
</script>

<template>
    <Dialog v-model:visible="localDialogVisible" header="New Message" modal class="mx-3 sm:mx-0 sm:w-full md:w-8 lg:w-6" contentClass="border-round-bottom border-top-1 surface-border p-0">
        <div class="p-0 m-0">
            <div class="surface-section grid grid-nogutter formgrid flex-column md:flex-row gap-6 p-5 border-round">
                <div class="col">
                    <label for="to" class="block text-900 font-semibold mb-3">To</label>
                    <IconField iconPosition="left" class="w-full" style="height: 3.5rem">
                        <InputIcon class="pi pi-user" style="left: 1.5rem" />
                        <InputText id="to" type="text" class="w-full pl-7 text-900 font-semibold" style="height: 3.5rem" v-model="content.from" />
                    </IconField>
                </div>
                <div class="col">
                    <label for="Subject" class="block text-900 font-semibold mb-3">Subject</label>
                    <IconField iconPosition="left" class="w-full" style="height: 3.5rem">
                        <InputIcon class="pi pi-pencil" style="left: 1.5rem" />
                        <InputText id="subject" type="text" placeholder="Subject" class="w-full pl-7 text-900 font-semibold" style="height: 3.5rem" v-model="content.title" />
                    </IconField>
                </div>
                <div v-if="displayMessage" class="col-12 field">
                    <div class="border-1 surface-border border-round p-4">{{ content.message }}</div>
                </div>
                <div class="col-12 field">
                    <span class="surface-ground cursor-pointer border-round px-2" @click="toggleMessage()" v-tooltip="displayMessage ? 'Hide content' : 'Show content'"><i class="pi pi-ellipsis-h"></i></span>
                    <Editor :editorStyle="{ height: '250px' }" class="mt-3" v-model="newMail.message"></Editor>
                </div>
            </div>
            <div class="flex column-gap-3 justify-content-end p-5 border-top-1 surface-border">
                <Button type="button" outlined icon="pi pi-image"></Button>
                <Button type="button" outlined icon="pi pi-paperclip"></Button>
                <Button type="button" class="h-3rem" icon="pi pi-send" label="Send" @click="sendMail()"></Button>
            </div>
        </div>
    </Dialog>
</template>
