export const isTouchScreen =
  typeof window !== 'undefined' 
  && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export const getKeyByValue = (object: any, value: any) => {
  return Object.keys(object).find(key => object[key] === value);
}