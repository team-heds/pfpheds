<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const comments = ref([
    {
        image: '/demo/images/avatar/circle/avatar-f-3@2x.png',
        name: 'Courtney Henry',
        date: '03 February 2022',
        description: 'Reprehenderit ut voluptas sapiente ratione nostrum est.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-1@2x.png',
        name: 'Esther Howard',
        date: '03 February 2022',
        description: 'How likely are you to recommend our company to your friends and family ?'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-4@2x.png',
        name: 'Darlene Robertson',
        date: '03 February 2022',
        description: 'Quo quia sit nihil nemo doloremque et.'
    },
    {
        image: '/demo/images/avatar/circle/avatar-f-5@2x.png',
        name: 'Esther Howard',
        date: '03 February 2022',
        description: 'How likely are you to recommend our company to your friends and family ?'
    }
]);

const navigateToEdit = () => {
    router.push({ name: 'blog-edit' });
};
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between flex-column-reverse md:flex-row align-items-center">
            <div>
                <div class="text-xl text-900 mb-4 mt-4 md:mt-0 text-center md:text-left font-semibold md:pr-4">How To Get Started Tutorial</div>
                <div class="flex flex-wrap justify-content-center md:justify-content-start gap-3">
                    <span class="inline-flex align-items-center py-2 px-3 font-medium border-1 surface-border border-round">
                        <i class="pi pi-clock text-primary mr-2"></i>
                        <span class="text-900">2d ago</span>
                    </span>
                    <span class="inline-flex align-items-center py-2 px-3 font-medium border-1 surface-border border-round">
                        <i class="pi pi-comments text-primary mr-2"></i>
                        <span class="text-900">24</span>
                    </span>
                    <span class="inline-flex align-items-center py-2 px-3 font-medium border-1 surface-border border-round">
                        <i class="pi pi-eye text-primary mr-2"></i>
                        <span class="text-900">124</span>
                    </span>
                </div>
            </div>
            <div class="flex flex-column align-items-center justify-content-center">
                <img class="w-4rem h-4rem" src="/demo/images/avatar/circle/avatar-f-2@2x.png" alt="Avatar" />
                <span class="mt-3 font-bold text-900 text-center white-space-nowrap">Jane Cooper</span>
            </div>
        </div>
        <div class="text-center my-6">
            <img src="/demo/images/blog/blogdetail.png" alt="Image" class="w-full" />
        </div>
        <div class="text-2xl text-900 mb-4 font-semibold">Sodales massa, morbi convallis</div>
        <p class="line-height-3 text-lg mb-4">
            First, a disclaimer - the entire process of writing a blog post often takes more than a couple of hours, even if you can type eighty words per minute and your writing skills are sharp. From the seed of the idea to finally hitting
            “Publish,” you might spend several days or maybe even a week “writing” a blog post, but it&lsquo;s important to spend those vital hours planning your post and even thinking about Your Post(yes, thinking counts as working if you&lsquo;re a
            blogger) before you actually write it.
        </p>
        <p class="line-height-3 text-lg mb-4">There&lsquo;s an old maxim that states, “No fun for the writer, no fun for the reader.”No matter what industry you&lsquo;re working in, as a blogger, you should live and die by this statement.</p>
        <p class="line-height-3 text-lg mb-4">
            Before you do any of the following steps, be sure to pick a topic that actually interests you. Nothing - and I mean NOTHING- will kill a blog post more effectively than a lack of enthusiasm from the writer. You can tell when a writer is
            bored by their subject, and it&lsquo;s so cringe-worthy it&lsquo;s a little embarrassing.
        </p>
        <p class="line-height-3 text-lg mb-4">
            I can hear your objections already. “But Dan, I have to blog for a cardboard box manufacturing company.” I feel your pain, I really do. During the course of my career, I&lsquo;ve written content for dozens of clients in some
            less-than-thrilling industries (such as financial regulatory compliance and corporate housing), but the hallmark of a professional blogger is the ability to write well about any topic, no matter how dry it may be. Blogging is a lot
            easier, however, if you can muster at least a little enthusiasm for the topic at hand.
        </p>
        <div class="text-2xl text-900 mb-4 font-semibold">Commodo ultrices orci tempus et fermentum, pellentesque ultricies.</div>
        <ul class="text-xl p-0 my-0 ml-5">
            <li class="mb-3 line-height-3">Fermentum neque odio laoreet morbi sit. Venenatis in quam ut non.</li>
            <li class="mb-3 line-height-3">Enim in porta facilisi a vulputate fermentum, morbi. Consequat, id praesent tristique euismod pellentesque.</li>
            <li class="mb-3 line-height-3">Implements This is an external link</li>
            <li class="line-height-3">Scelerisque ultricies tincidunt lectus faucibus non morbi sed nibh varius. Quam a, habitasse egestaseleifend.</li>
        </ul>
        <div class="flex flex-column sm:flex-row my-8 w-full gap-3">
            <Button icon="pi pi-twitter" severity="secondary" label="Twitter"></Button>
            <Button icon="pi pi-facebook" severity="secondary" label="Facebook"></Button>
            <Button @click="navigateToEdit" icon="pi pi-pencil" class="sm:ml-auto" label="Edit Post"></Button>
        </div>
        <div class="flex align-items-center mb-4 font-bold">
            <span class="text-xl text-900 mr-4">Comments</span>
            <span class="inline-flex align-items-center justify-content-center w-2rem h-2rem border-1 surface-border border-round">{{ comments.length }}</span>
        </div>
        <ul class="list-none p-0 m-0">
            <li v-for="(comment, i) in comments" :key="{ i }" class="flex p-3 mb-3 border-1 surface-border border-round">
                <img :src="comment.image" class="w-3rem h-3rem mr-3 flex-shrink-0" :alt="'Image' + i" />
                <div>
                    <span class="font-semibold text-900">{{ comment.name }}</span>
                    <p class="font-semibold text-600 m-0 text-sm">{{ comment.date }}</p>
                    <p class="line-height-3 mb-0 my-3">{{ comment.description }}</p>
                </div>
            </li>
        </ul>
        <div class="text-xl text-900 mb-4 font-bold mt-8">Post a Comment</div>

        <div class="mb-3 p-fluid">
            <IconField iconPosition="left">
                <InputIcon class="pi pi-user" />
                <InputText type="text" placeholder="Name" />
            </IconField>
        </div>
        <div class="mb-3 p-fluid">
            <IconField iconPosition="left">
                <InputIcon class="pi pi-envelope" />
                <InputText type="text" placeholder="Email" />
            </IconField>
        </div>
        <div class="mb-3 p-fluid">
            <Textarea :rows="6" placeholder="Your comment"></Textarea>
        </div>
        <div class="flex justify-content-end">
            <Button label="Post Comment"></Button>
        </div>
    </div>
</template>
