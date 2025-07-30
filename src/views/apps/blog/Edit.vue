<script setup>
import { ref } from 'vue';
const tags = ref(['Software', 'Web']);
const fileUploaderRef = ref(null);
const uploadFiles = ref([]);

const onChooseUploadFiles = () => {
    fileUploaderRef.value.choose();
};
const onSelectedFiles = (event) => {
    uploadFiles.value = event.files;
};
const onRemoveFile = (removeFile) => {
    uploadFiles.value = uploadFiles.value.filter((file) => file.name !== removeFile.name);
};
</script>

<template>
    <div class="card">
        <span class="block text-900 font-bold text-xl mb-4">Create a new post</span>
        <div class="grid">
            <div class="col-12 lg:col-8">
                <FileUpload
                    ref="fileUploaderRef"
                    name="demo[]"
                    accept="image/*"
                    customUpload
                    multiple
                    auto
                    :maxFileSize="1000000"
                    @select="onSelectedFiles"
                    :pt="{
                        root: { class: 'border-1 surface-border surface-card p-0 border-round mb-4' },
                        buttonbar: { class: 'hidden' },
                        removeButton: { class: 'flex' }
                    }"
                >
                    <template v-if="uploadFiles.length > 0" #content>
                        <div class="h-20rem m-1 border-round">
                            <div v-for="file in uploadFiles" :key="file.name" class="w-full h-full relative border-round p-0" :style="{ cursor: 'copy' }">
                                <div class="remove-file-wrapper h-full relative border-3 border-transparent border-round hover:bg-primary transition-duration-100 cursor-auto" :style="{ padding: '1px' }">
                                    <img :src="file.objectURL" :alt="file.name" class="w-full h-full border-round" />
                                    <Button
                                        icon="pi pi-times"
                                        class="remove-button text-sm absolute justify-content-center align-items-center cursor-pointer"
                                        rounded
                                        :style="{ top: '-10px', right: '-10px', display: 'none' }"
                                        @click="onRemoveFile(file)"
                                    ></Button>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #empty>
                        <div v-if="uploadFiles.length < 1" class="h-20rem m-1 border-round">
                            <div @click="onChooseUploadFiles" class="flex flex-column w-full h-full justify-content-center align-items-center cursor-pointer" :style="{ cursor: 'copy' }">
                                <i class="pi pi-fw pi-file text-4xl text-primary"></i>
                                <span class="block font-semibold text-900 text-lg mt-3">Drop or select a cover image</span>
                            </div>
                        </div>
                    </template>
                </FileUpload>
                <div class="flex flex-column p-fluid">
                    <div class="mb-4 mt-3">
                        <InputText type="text" placeholder="Title" />
                    </div>
                    <div class="mb-4">
                        <Textarea rows="6" placeholder="Content" autoResize></Textarea>
                    </div>

                    <Editor editorStyle="height: 320px"></Editor>
                </div>
            </div>
            <div class="col-12 lg:col-4">
                <div class="border-1 surface-border border-round mb-4">
                    <span class="text-900 font-bold block border-bottom-1 surface-border p-3">Publish</span>
                    <div class="p-3">
                        <div class="surface-100 p-3 flex align-items-center border-round">
                            <span class="text-900 font-semibold mr-3">Status:</span>
                            <span class="font-medium">Draft</span>
                            <Button type="button" icon="pi pi-fw pi-pencil" class="ml-auto" text rounded></Button>
                        </div>
                    </div>
                    <div class="p-3">
                        <div class="surface-100 p-3 flex align-items-center border-round">
                            <span class="text-900 font-semibold mr-3">Visibility:</span>
                            <span class="font-medium">Private</span>
                            <Button type="button" icon="pi pi-fw pi-pencil" class="ml-auto" text rounded></Button>
                        </div>
                    </div>
                </div>
                <div class="border-1 surface-border border-round mb-4">
                    <span class="text-900 font-bold block border-bottom-1 surface-border p-3">Tags</span>
                    <div class="p-3 flex gap-2"><Chip v-for="(tag, i) in tags" :key="i" :label="tag"></Chip></div>
                </div>
                <div class="border-1 surface-border border-round p-fluid mb-4">
                    <span class="text-900 font-bold block border-bottom-1 surface-border p-3">Meta</span>
                    <div class="p-3">
                        <div class="mb-4">
                            <InputText type="text" placeholder="Title" />
                        </div>
                        <div><Textarea rows="6" placeholder="Description" autoResize></Textarea></div>
                    </div>
                </div>
                <div class="flex justify-content-between gap-3">
                    <Button class="flex-1" severity="danger" outlined label="Discard" icon="pi pi-fw pi-trash"></Button>
                    <Button class="flex-1" label="Publish" icon="pi pi-fw pi-check"></Button>
                </div>
            </div>
        </div>
    </div>
</template>
