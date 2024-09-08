import { sveltePreprocess } from 'svelte-preprocess'
import adapter from "svelte-adapter-bun";

export default {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
    preprocess: sveltePreprocess({ scss: true }),
};
