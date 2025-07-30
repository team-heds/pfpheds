<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({
    inheritAttrs: false
});

const emit = defineEmits(['new:mail']);
const router = useRouter();
const newMail = ref({});

const goBack = () => {
    router.push({ name: 'mail-inbox' });
};

const sendMail = () => {
    const mail = {
        ...newMail.value,
        id: generateId(),
        sent: true,
        archived: false,
        trash: false,
        spam: false,
        starred: false,
        important: false,
        date: generateDate(),
        image: 'avatar.png'
    };

    emit('new:mail', mail);
    router.push({ name: 'mail-inbox' });
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
</script>

<template>
    <div class="flex align-items-center px-4 md:px-0 border-top-1 surface-border md:border-none pt-4 md:pt-0">
        <Button type="button" icon="pi pi-chevron-left" class="surface-border text-900 w-3rem h-3rem mr-3" outlined severity="secondary" @click="goBack()"></Button>
        <span class="block text-900 font-bold text-xl">Compose Message</span>
    </div>
    <div class="surface-section grid mt-4 grid-nogutter formgrid p-4 gap-3 md:surface-border md:border-1 border-round">
        <div class="col-12 field">
            <label for="to" class="text-900 font-semibold">To</label>
            <IconField iconPosition="left" class="w-full" style="height: 3.5rem">
                <InputIcon class="pi pi-user" style="left: 1.5rem" />
                <InputText id="to" type="text" v-model="newMail.to" class="w-full pl-7 text-900 font-semibold" style="height: 3.5rem" />    
            </IconField>
        </div>
        <div class="col-12 field">
            <label for="Subject" class="text-900 font-semibold">Subject</label>
            <IconField iconPosition="left" class="w-full" style="height: 3.5rem">
                <InputIcon class="pi pi-pencil" style="left: 1.5rem" />
                <InputText id="subject" type="text" v-model="newMail.title" placeholder="Subject" class="w-full pl-7 text-900 font-semibold" style="height: 3.5rem" />
            </IconField>
        </div>
        <div class="col-12 field">
            <Editor v-model="newMail.message" editorStyle=" height: 250px "></Editor>
        </div>
        <div class="col-12 flex column-gap-3 justify-content-end mt-7">
            <Button type="button" class="h-3rem w-full sm:w-auto" icon="pi pi-send" label="Send Message" @click="sendMail()"></Button>
        </div>
    </div>
</template>
