<script lang="ts">
  import { isUndergroundMapActive } from "@addons/stores";
  import { onDestroy } from "svelte";
  import { unsafeWindow } from "$";
  import { getKeyByValue } from "@addons/utils";

  let active: boolean;
  let HOOKED_changeMapsType;

  if(unsafeWindow.changeMapsType) {
    HOOKED_changeMapsType = unsafeWindow.changeMapsType;
    unsafeWindow.changeMapsType = function(params, target) {
        isUndergroundMapActive.update((active) => params?.strTarget?.startsWith("지하"));
        let ret = HOOKED_changeMapsType.apply(this, arguments);
        return ret;
    };
  }
  

  const unsubscribe = isUndergroundMapActive.subscribe((value) => {
    active = value;
    let mapsObject = unsafeWindow.MAPS_Version[unsafeWindow.MAPS_Type].maps;
    let targetName = value ? "지하" : "지상";
    let mapTargetName = Object.keys(mapsObject).find(key => key.startsWith(targetName));
    console.log(`targetName: ${targetName}`);
    console.log(`mapTargetName: ${mapTargetName}`);
    let params = {
      strCode: unsafeWindow.MAPS_Type,
    };
    if(mapTargetName) {
        params.strTarget = mapTargetName;
        HOOKED_changeMapsType(
            params,
            unsafeWindow.MAPS_Type
        );
    }
        
  });

  function handleClick() {
    isUndergroundMapActive.update((active) => !active);
    console.log(`click, and current isUndergroundMapActive is ${active}`);
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
