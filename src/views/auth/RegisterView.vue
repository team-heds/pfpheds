<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref } from 'vue';
import AppConfig from '@/layout/AppConfig.vue';
import { useRouter } from 'vue-router';

const value = ref(null);

const router = useRouter();

const { layoutConfig } = useLayout();

const confirmed = ref(false);
const darkMode = computed(() => {
    return layoutConfig.colorScheme.value !== 'light';
});

const navigateToLogin = () => {
    router.push({ name: 'login' });
};
</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" class="fixed left-0 top-0 min-h-screen min-w-screen" preserveAspectRatio="none">
        <rect :fill="darkMode ? 'var(--primary-900)' : 'var(--primary-500)'" width="1600" height="800" />
        <path
            :fill="darkMode ? 'var(--primary-800)' : 'var(--primary-400)'"
            d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5 176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2
        478.4 581z"
        />
        <path
            :fill="darkMode ? 'var(--primary-700)' : 'var(--primary-300)'"
            d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7 158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z"
        />
        <path
            :fill="darkMode ? 'var(--primary-600)' : 'var(--primary-200)'"
            d="M454.9 86.3C600.7 177 751.6 269.3 924.1 325c208.6 67.4 431.3 60.8 637.9-5.3c12.8-4.1 25.4-8.4 38.1-12.9V0H288.1c56 21.3 108.7 50.6 159.7 82C450.2 83.4 452.5 84.9 454.9 86.3z"
        />
        <path :fill="darkMode ? 'var(--primary-500)' : 'var(--primary-100)'" d="M1397.5 154.8c47.2-10.6 93.6-25.3 138.6-43.8c21.7-8.9 43-18.8 63.9-29.5V0H643.4c62.9 41.7 129.7 78.2 202.1 107.4C1020.4 178.1 1214.2 196.1 1397.5 154.8z" />
    </svg>
    <div class="px-5 min-h-screen flex justify-content-center align-items-center">
        <div class="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
            <div class="mb-4">
                <div class="text-900 text-xl font-bold mb-2">Register</div>
                <span class="text-600 font-medium">Let&lsquo;s get started</span>
            </div>
            <div class="flex flex-column">
                <IconField iconPosition="left" class="w-full mb-4">
                    <InputIcon class="pi pi-user" />
                    <InputText id="username" type="text" class="w-full md:w-25rem" placeholder="Username" />
                </IconField>
                <IconField iconPosition="left" class="w-full mb-4">
                    <InputIcon class="pi pi-envelope" />
                    <InputText id="email" type="text" class="w-full md:w-25rem" placeholder="Email" />
                </IconField>
                <IconField iconPosition="left" class="w-full mb-4">
                    <InputIcon class="pi pi-lock z-2" />
                    <Password id="password" placeholder="Password" v-model="value" class="w-full" :inputStyle="{ paddingLeft: '2.5rem' }" inputClass="w-full md:w-25rem" toggleMask></Password>
                </IconField>
                <div class="mb-4 flex flex-wrap">
                    <Checkbox name="checkbox" v-model="confirmed" class="mr-2" binary></Checkbox>
                    <label for="checkbox" class="text-900 font-medium mr-2"> I have read the </label>
                    <a class="text-600 cursor-pointer hover:text-primary cursor-pointer">Terms and Conditions</a>
                </div>
                <Button label="Sign Up" class="w-full mb-4"></Button>
                <span class="font-medium text-600"> Already have an account? <a class="font-semibold cursor-pointer text-900 hover:text-primary transition-colors transition-duration-300" @click="navigateToLogin">Login</a> </span>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>
