<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import MailSidebar from './MailSidebar.vue';
import Reply from './Reply.vue';

const toast = useToast();

const allMails = ref([]);
const filteredMails = ref({});
const activeMailItem = ref('inbox');
const dialogVisible = ref(false);
const mailDetail = ref(null);
const router = useRoute();

onMounted(async () => {
    activeMailItem.value = router.path.split('/')[3];
    allMails.value = await getMails();
    initMail(allMails.value);
});

watch(
    () => router.path,
    (newPath) => {
        activeMailItem.value = newPath.split('/')[3];
    }
);

const initMail = async (mails) => {
    setBadgeValues(mails);
};

const getMails = async () => {
    const response = await fetch('/demo/data/mail.json');
    const { data } = await response.json();

    return data;
};

const setBadgeValues = (mails) => {
    for (const mail of mails) {
        if (!mail.archived && !mail.trash && !mail.spam && !mail.sent) {
            setFilteredMails('inbox', mail);
        }
        Object.keys(mail).forEach((label) => {
            if (mail[label] === true) {
                setFilteredMails(label, mail);
            }
        });
    }
};

const setFilteredMails = (type, mail) => {
    if (!filteredMails.value[type]) {
        filteredMails.value[type] = [];
    } else {
        filteredMails.value[type].push(mail);
    }
};

const sidebarItems = computed(() => {
    const mails = filteredMails.value;

    return [
        { label: 'Inbox', icon: 'pi pi-inbox', badge: mails.inbox?.length || 0, routerLink: '/apps/mail/inbox' },
        { label: 'Starred', icon: 'pi pi-star', badge: mails.starred?.length || 0, routerLink: '/apps/mail/starred' },
        { label: 'Spam', icon: 'pi pi-ban', badge: mails.spam?.length || 0, routerLink: '/apps/mail/spam' },
        { label: 'Important', icon: 'pi pi-bookmark', badge: mails.important?.length || 0, routerLink: '/apps/mail/important' },
        { label: 'Sent', icon: 'pi pi-send', badge: mails.sent?.length || 0, routerLink: '/apps/mail/sent' },
        { label: 'Archived', icon: 'pi pi-book', badge: mails.archived?.length || 0, routerLink: '/apps/mail/archived' },
        { label: 'Trash', icon: 'pi pi-trash', badge: mails.trash?.length || 0, routerLink: '/apps/mail/trash' }
    ];
});

const onDeleteMail = async (selectedMails) => {
    filteredMails.value = {};
    const toastDetail = selectedMails.length > 0 ? 'Mails deleted' : 'Mail deleted';

    findAndApplyAction('trash', selectedMails);

    toast.add({ severity: 'info', summary: 'Info', detail: toastDetail, life: 3000 });
    initMail(allMails.value);
};

const onSpamMail = async (selectedMails) => {
    filteredMails.value = {};

    selectedMails.forEach((selectedMail) => {
        allMails.value.find((mail) => mail.id === selectedMail.id).spam = true;
    });
    initMail(allMails.value);
};

const onArchiveMail = async (selectedMails) => {
    filteredMails.value = {};

    findAndApplyAction('archived', selectedMails);

    initMail(allMails.value);
};

const onChangeMailType = async (type, selectedMail, value) => {
    filteredMails.value = {};

    allMails.value.find((mail) => mail.id === selectedMail.id)[type] = value;

    initMail(allMails.value);
};

const findAndApplyAction = (action, selectedMails) => {
    if (selectedMails.length > 0) {
        selectedMails.forEach((selectedMail) => {
            allMails.value.find((mail) => mail.id === selectedMail.id)[action] = true;
        });
    } else {
        allMails.value.find((mail) => mail.id === selectedMails.id)[action] = true;
    }
};

const showReplyDialog = (mail) => {
    dialogVisible.value = true;
    mailDetail.value = mail;
};

const onSaveReplyMail = (mail) => {
    dialogVisible.value = false;
    mailDetail.value = null;

    filteredMails.value = {};
    allMails.value.push(mail);

    initMail(allMails.value);
};

const onSendNewMail = (mail) => {
    filteredMails.value = {};
    allMails.value.push(mail);

    initMail(allMails.value);
};

const onChangeDialogVisibility = (isVisible) => {
    dialogVisible.value = isVisible;
};
</script>

<template>
    <div class="card">
        <div class="flex flex-column md:flex-row gap-4">
            <div class="w-full md:w-3 xl:w-2 xl:p-3">
                <MailSidebar :items="sidebarItems"></MailSidebar>
            </div>
            <div class="md:w-9 xl:w-10 xl:p-3">
                <router-view
                    :allMails="allMails"
                    :mails="filteredMails[activeMailItem] || undefined"
                    @trash="onDeleteMail"
                    @spam="onSpamMail"
                    @archive="onArchiveMail"
                    @change:mail:type="onChangeMailType"
                    @reply="showReplyDialog"
                    @send:message="onSaveReplyMail"
                    @new:mail="onSendNewMail"
                ></router-view>
            </div>
        </div>
    </div>
    <Reply v-model:visible="dialogVisible" :mail-detail="mailDetail" @save="onSaveReplyMail" @update:dialogVisible="onChangeDialogVisibility()"></Reply>
</template>
