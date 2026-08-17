import { cosAsset } from "../lib/cosAsset.js";

const COS = cosAsset("");
const BAI_QUAN = `${COS}/败犬`;
const RI_CHANG = `${COS}/日常`;

export const galleryAlbums = [
  {
    id: "bai-quan",
    title: "败犬",
    eyebrow: "Album 01",
    description: "",
    tone: "from-[#EAF6FF] via-[#F7F1FF] to-[#FFF5FA]",
    accent: "#7C5CFF",
    cover: `${BAI_QUAN}/01.jpg`,
    images: [
      `${BAI_QUAN}/01.jpg`,
      `${BAI_QUAN}/02.jpg`,
      `${BAI_QUAN}/03.jpg`,
      `${BAI_QUAN}/04.jpg`,
      `${BAI_QUAN}/05.jpg`,
      `${BAI_QUAN}/06.jpg`,
      `${BAI_QUAN}/07.jpg`,
      `${BAI_QUAN}/08.jpg`,
    ],
  },
  {
    id: "ri-chang",
    title: "日常",
    eyebrow: "Album 02",
    description: "",
    tone: "from-[#FFF1E6] via-[#FFE9F0] to-[#F7F1FF]",
    accent: "#ff8fab",
    cover: `${RI_CHANG}/454dfe41edc668fcd2a635ac3b786361.jpg`,
    images: [
      `${RI_CHANG}/454dfe41edc668fcd2a635ac3b786361.jpg`,
      `${RI_CHANG}/7f992f7e757ac542290c4821c641157a.jpg`,
      `${RI_CHANG}/aae3196de47597a2c996593052a48a9b.jpg`,
      `${RI_CHANG}/c810a6f8664183da576cc3e12e0e0bac.jpg`,
      `${RI_CHANG}/f7def8de0250ae84d7dd2e420d724282.jpg`,
      `${RI_CHANG}/fedcbfce0d6026ce5f5342d15da6a8da.jpg`,
    ],
  },
];

export const getGalleryAlbum = (id) =>
  galleryAlbums.find((album) => album.id === id);
