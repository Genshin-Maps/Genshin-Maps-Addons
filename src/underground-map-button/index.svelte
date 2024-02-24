<script lang="ts">
  import { isUndergroundMapActive } from "@addons/stores";
  import { onDestroy } from "svelte";
  import { unsafeWindow } from "$";

  let active: boolean;

  const unsubscribe = isUndergroundMapActive.subscribe((value) => {
    active = value;

    const selector: string = active ? "지하" : "지상";
    const targetCode = document
      .querySelector(
        `#tempMapsTypeList > .point-panel-tag-maps[data-target^="${selector}"]`
      )
      ?.getAttribute("data-target");
    unsafeWindow.changeMapsType(
      {
        strCode: unsafeWindow.MAPS_Type,
        strTarget: targetCode,
      },
      unsafeWindow.MAPS_Type
    );
  });

  function handleClick() {
    isUndergroundMapActive.update((active) => !active);
  }

  function handleResetSelectionPosition() {
    let confirmed = confirm("지하 지도 선택창 위치를 초기화 하시겠습니까?");
    if (confirmed) {
      alert(
        "지하 지도 선택창 위치가 초기화되었습니다. 새로고침 후 적용됩니다."
      );
      localStorage.removeItem("addon-underground-select-positions");
    }
  }

  onDestroy(unsubscribe);
</script>

<template>
  <div class="maps-addons-switch-label">지하 맵</div>
  <button
    class="maps-addons-switch {active ? 'on' : ''}"
    on:click={handleClick}
    on:contextmenu|preventDefault={handleResetSelectionPosition}
  />
</template>

<style>
</style>
