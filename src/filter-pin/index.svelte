<script lang="ts">
  import { isFilterPinActive, isUndergroundMapActive } from "@addons/stores";
  import { onDestroy } from "svelte";
  import { unsafeWindow } from "$";
  import { get } from "svelte/store";

  let active: boolean;

  const unsubscribe = isFilterPinActive.subscribe((value) => {
    active = value;
    unsafeWindow.setPinObjectRefresh();
  });

  function handleClick() {
    isFilterPinActive.update((active) => !active);
  }

  export const removeUnnecessary = () => {
    if (!active) return;
    const dataSelector = get(isUndergroundMapActive)
      ? ':not([data-strata]):not([data-tip*="지하 및 실내 구역 입구"])'
      : "[data-strata]";
    document
      .querySelectorAll(`#mapsLayerPoint > .maps-point${dataSelector}`)
      .forEach((element) => element.remove());
  };

  onDestroy(unsubscribe);
</script>

<template>
  <div class="maps-addons-switch-label">활성맵 핀</div>
  <button
    class="maps-addons-switch {active ? 'on' : ''}"
    on:click={handleClick}
  />
</template>

<style>
</style>
