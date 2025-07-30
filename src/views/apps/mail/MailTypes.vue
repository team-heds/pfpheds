<script setup>
import { onBeforeUnmount, onUpdated, ref, onMounted } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useRouter } from 'vue-router';

const emit = defineEmits(['spam', 'archive', 'trash', 'change:mail:type', 'reply']);

defineProps({
    mails: {
        type: Array
    }
});

const router = useRouter();
const menuRef = ref(null);
const mailTable = ref(null);
const selectedMails = ref([]);
const menuItems = ref([
    { label: 'Archive', icon: 'pi pi-file', command: () => onSelectedMailsAction('archive') },
    { label: 'Spam', icon: 'pi pi-ban', command: () => onSelectedMailsAction('spam') },
    { label: 'Delete', icon: 'pi pi-trash', command: () => onSelectedMailsAction('trash') }
]);
const filterTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    setEventListenersOnRow('addEventListener');
});

onUpdated(async () => {
    await setEventListenersOnRow('removeEventListener');
    await setEventListenersOnRow('addEventListener');
});

onBeforeUnmount(() => {
    setEventListenersOnRow('addEventListener');
});

const setEventListenersOnRow = (type) => {
    const mailRowsRefs = [...mailTable.value.$el.querySelectorAll('tbody > tr')];

    mailRowsRefs.forEach((mailRow) => {
        mailRow[type]('mouseenter', (event) => actionButtonToggle(event, mailRow));
        mailRow[type]('mouseleave', (event) => actionButtonToggle(event, mailRow));
    });
};
const actionButtonToggle = (event, mailRow) => {
    const actionButtonsRef = mailRow.querySelector('.action-buttons');
    const dateRef = mailRow.querySelector('.date-text');

    if (!actionButtonsRef || !dateRef) return;

    if (event.type === 'mouseenter') {
        actionButtonsRef.style.display = 'flex';
        dateRef.style.display = 'none';
    } else {
        actionButtonsRef.style.display = 'none';
        dateRef.style.display = 'flex';
    }
};

const onSelectedMailsAction = (emitType) => {
    if (selectedMails.value.length !== 0) {
        for (const mail of selectedMails.value) {
            clearMaileActions(mail);
        }

        emit(emitType, selectedMails.value);
        selectedMails.value = [];
    }
};

const onSingleMailAction = (emitType, mail) => {
    clearMaileActions(mail);

    emit(emitType, mail);

    selectedMails.value = [];
};

const changeMailType = (mailType, mail) => {
    emit('change:mail:type', mailType, mail, !mail[mailType]);
};

const onReplyMail = (mail) => {
    emit('reply', mail);
};

const onNavigateToDetailPage = (id) => {
    router.push({ name: 'mail-detail', params: { id } });
};

const clearMaileActions = (mail) => {
    Object.keys(mail).forEach((key) => {
        if (mail[key] === true) {
            mail[key] = false;
        }
    });
};
</script>

<template>
    <DataTable ref="mailTable" :value="mails" v-model:selection="selectedMails" v-model:filters="filterTable" :rows="10" paginator :rowsPerPageOptions="[10, 20, 30]" dataKey="id" rowHover :globalFilterFields="['from', 'to', 'title', 'message']">
        <Column selectionMode="multiple" style="width: 4rem"> </Column>
        <Column style="width: 8rem">
            <template #header>
                <div class="flex -ml-2">
                    <Button type="button" icon="pi pi-refresh" text plain rounded></Button>
                    <Button type="button" icon="pi pi-ellipsis-v" class="ml-3" text plain rounded @click="menuRef.toggle($event)"></Button>
                    <Menu ref="menuRef" popup :model="menuItems" class="w-8rem"></Menu>
                </div>
                <div></div>
            </template>
            <template #body="{ data }">
                <td v-if="!data.trash && !data.spam" class="w-4rem">
                    <span class="cursor-pointer" @click="changeMailType('starred', data)">
                        <i class="pi pi-fw text-xl" :class="{ 'pi-star-fill': data.starred, 'pi-star': !data.starred }"></i>
                    </span>
                </td>
                <td v-if="!data.trash && !data.spam" class="w-4rem">
                    <span class="cursor-pointer ml-3" @click="changeMailType('important', data)">
                        <i class="pi pi-fw text-xl" :class="{ 'pi-bookmark-fill': data.important, 'pi-bookmark': !data.important }"></i>
                    </span>
                </td>
            </template>
        </Column>
        <Column style="min-width: 4rem">
            <template #body="{ data }">
                <Avatar v-if="!data.image" icon="pi pi-user" shape="circle"></Avatar>
                <Avatar v-else @click="onNavigateToDetailPage(data.id)" :id="data.id" :image="`/demo/images/avatar/${data.image ? data.image : '.png'}`" class="cursor-pointer"></Avatar>
            </template>
        </Column>
        <Column style="min-width: 4rem">
            <template #body="{ data }">
                <div @click="onNavigateToDetailPage(data.id)" :style="{ minWidth: '12rem' }" class="text-900 font-semibold cursor-pointer">{{ data.from || data.to }}</div>
            </template>
        </Column>
        <Column style="min-width: 30rem">
            <template #body="{ data }">
                <span @click="onNavigateToDetailPage(data.id)" class="font-medium white-space-nowrap overflow-hidden text-overflow-ellipsis block cursor-pointer" style="max-width: 30rem">
                    {{ data.title }}
                </span>
            </template>
        </Column>
        <Column field="date">
            <template #header>
                <IconField iconPosition="left" class="w-full">
                    <InputIcon class="pi pi-search" />
                    <InputText type="text" placeholder="Search Mail" class="w-full sm:w-auto" v-model="filterTable.global.value" />
                </IconField>
            </template>
            <template #body="{ data }">
                <div :style="{ minWidth: '10rem' }">
                    <div class="flex justify-content-end w-full px-0">
                        <span ref="dateRef" class="date-text text-700 font-semibold white-space-nowrap">
                            {{ data.date }}
                        </span>
                        <div ref="actionRef" class="action-buttons" style="display: none">
                            <Button @click="onSingleMailAction('archive', data)" type="button" icon="pi pi-inbox" class="h-2rem w-2rem mr-2" v-tooltip.top="'Archive'"></Button>
                            <Button @click="onReplyMail(data)" type="button" icon="pi pi-reply" class="h-2rem w-2rem mr-2" severity="secondary" v-tooltip.top="'Reply'"></Button>
                            <Button @click="onSingleMailAction('trash', data)" type="button" v-tooltip.top="'Trash'" icon="pi pi-trash" class="h-2rem w-2rem" severity="danger"></Button>
                        </div>
                    </div>
                </div>
            </template>
        </Column>
    </DataTable>
</template>
