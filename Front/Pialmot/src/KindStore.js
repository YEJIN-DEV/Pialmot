import { writable } from 'svelte/store';

export const kind = writable([
    "anime", // 애니 삽입곡
    "original", // 오리지널
    "single", // 싱글
    "game", // 게임 삽입곡
    "unit", // 유닛
    "special", // 특전
    "album", // 정규 앨범
]);
export const group = writable("");
export const allkindchoices = writable(true);
export const inited = writable(false);
export const inQuestion = writable(false);
export const inPlay = writable(false); //게임 시작 버튼(럽라버튼)이 눌렸는지