import App from "./App.svelte";

const addons = new App({
    target: document.body,
    props: {},
});

import { isFilterPinActive, isUndergroundMapActive, isChestPinLoaded } from "./stores";
import { unsafeWindow } from "$";
import { get } from "svelte/store";

unsafeWindow.$store = (function () {
    function _isFilterPinActive() {
        return get(isFilterPinActive);
    }
    function _isUndergroundMapActive() {
        return get(isUndergroundMapActive);
    }
    function _isChestPinLoaded() {
        return get(isChestPinLoaded);
    }

    function _updateIsFilterPinActive(value: boolean) {
        return isFilterPinActive.set(value);
    }
    function _updateIsUndergroundMapActive(value: boolean) {
        return isUndergroundMapActive.set(value);
    }
    function _updateIsChestPinLoaded(value: boolean) {
        return isChestPinLoaded.set(value);
    }

    function _toggleIsFilterPinActive() {
        return isFilterPinActive.update((value) => !value);
    }
    function _toggleIsUndergroundMapActive() {
        return isUndergroundMapActive.update((value) => !value);
    }
    function _toggleIsChestPinLoaded() {
        return isChestPinLoaded.update((value) => !value);
    }

    return {
        isFilterPinActive: {
            get() {
                return _isFilterPinActive();
            },
            set(value: boolean) {
                _updateIsFilterPinActive(value);
            },
            toggle() {
                _toggleIsFilterPinActive();
            },
        },
        isUndergroundMapActive: {
            get() {
                return _isUndergroundMapActive();
            },
            set(value: boolean) {
                _updateIsUndergroundMapActive(value);
            },
            toggle() {
                _toggleIsUndergroundMapActive();
            },
        },
        isChestPinLoaded: {
            get() {
                return _isChestPinLoaded();
            },
            set(value: boolean) {
                _updateIsChestPinLoaded(value);
            },
            toggle() {
                _toggleIsChestPinLoaded();
            },
        },
    };
})();

export default addons;

