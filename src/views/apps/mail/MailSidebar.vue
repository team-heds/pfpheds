<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
defineProps({
    items: {
        type: Array,
        default: () => []
    }
});

const navigate = (item) => {
    const targetRoute = item.routerLink || '/apps/mail/compose';
    router.push(targetRoute);
};
</script>

<template>
    <div>
        <Button @click="navigate" label="Compose New" class="mb-5 w-full" outlined></Button>
        <div class="overflow-auto">
            <ul class="flex flex-row md:flex-column gap-1 md:gap-2 list-none m-0 p-0 overflow-auto">
                <li
                    v-for="item in items"
                    :key="item.id"
                    class="cursor-pointer select-none p-3 transition-duration-150 border-round flex align-items-center justify-content-center md:justify-content-start md:flex-1 flex-auto"
                    :class="{ 'bg-primary': router.currentRoute.value.path === item.routerLink, 'hover:surface-hover': router.currentRoute.value.path !== item.routerLink }"
                    @click="navigate(item)"
                >
                    <i class="md:mr-3 text-600 transition-duration-150 text-lg" :class="[item.icon, { 'text-primary-50': router.currentRoute.value.path === item.routerLink }]"></i>
                    <span class="text-900 font-medium hidden md:inline" :class="{ 'text-primary-50': router.currentRoute.value.path === item.routerLink }">{{ item.label }}</span>
                    <span v-if="item.badge" class="ml-auto text-sm font-semibold bg-primary-50 text-primary-900 px-2 py-1 hidden md:inline text-center" style="border-radius: 2rem; width: 23px; height: 23px">{{ item.badge }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>
