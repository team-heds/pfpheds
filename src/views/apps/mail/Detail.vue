<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const emit = defineEmits(['send:message']);
const props = defineProps({
    allMails: {
        type: Array,
        default: () => []
    }
});

const mail = ref({});
const newMail = ref({
    message: ''
});
const route = useRoute();
const router = useRouter();

const getMail = async () => {
    return props.allMails.find((mail) => parseInt(mail.id) === parseInt(route.params.id));
};

watch(
    () => props.allMails,
    async () => {
        mail.value = await getMail();
    },
    { immediate: true }
);

const sendMail = () => {
    const sendMail = {
        ...mail.value,
        ...newMail.value,
        id: generateId(),
        sent: true,
        archived: false,
        trash: false,
        spam: false,
        starred: false,
        important: false,
        date: generateDate()
    };
    emit('send:message', sendMail);
    router.push('/apps/mail/sent');
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

const goBack = () => {
    router.push({ name: 'mail-inbox' });
};
</script>

<template>
    <div>
        <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-5 pt-5 md:pt-0 gap-4 md:border-top-none border-top-1 surface-border">
            <div class="flex align-items-center md:justify-content-start">
                <Button type="button" icon="pi pi-chevron-left" class="md:mr-3" text plain @click="goBack()"></Button>
                <Avatar v-if="mail && mail.image" :image="'/demo/images/avatar/' + mail.image" size="large" shape="circle" class="border-2 surface-border"></Avatar>
                <div class="flex flex-column mx-3">
                    <span class="block text-900 font-bold text-lg">{{ mail?.from }}</span>
                    <span class="block text-900 font-semibold">To: {{ mail?.email || mail?.to }}</span>
                </div>
            </div>
            <div class="flex align-items-center justify-content-end column-gap-3 px-4 md:px-0">
                <span class="text-900 font-semibold white-space-nowrap mr-auto">{{ mail?.date }}</span>
                <Button type="button" icon="pi pi-reply" class="flex-shrink-0" text plain></Button>
                <Button type="button" icon="pi pi-ellipsis-v" class="flex-shrink-0" text plain></Button>
            </div>
        </div>
        <div class="surface-border border-1 border-round p-4">
            <div class="text-900 font-semibold text-lg mb-3">{{ mail?.title }}</div>
            <div class="line-height-3 mt-0 mb-3" v-html="mail?.message"></div>

            <Editor
                v-model="newMail.message"
                :pt="{
                    content: { style: { height: '250px' } }
                }"
            ></Editor>

            <div class="flex column-gap-3 justify-content-end mt-3">
                <Button type="button" outlined icon="pi pi-image"></Button>
                <Button type="button" outlined icon="pi pi-paperclip"></Button>
                <Button type="button" icon="pi pi-send" label="Send" @click="sendMail()"></Button>
            </div>
        </div>
    </div>
</template>
