# Research: uv／git／Node 在 Windows 與 Mac 的偵測與安裝路徑

Type: research
Status: resolved

## Question

為了寫進產品規格的 Environment Lane：在 **Windows** 與 **macOS** 上，官方或高信任來源建議如何（1）偵測 uv、git、Node.js 是否已可用，（2）若缺失，推薦哪種安裝方式（含常見指令或安裝器）？請分別列出各工具、各 OS 的選項與取捨（權限、PATH、是否需重開終端機），並標明規格應預設推薦哪一條路徑。

## Answer

規格預設為：uv 用 Astral standalone installer；Git 用 Windows 的 Git for Windows installer、macOS 的 Xcode Command Line Tools；Node.js 兩端皆用官網當期 LTS installer。每次安裝後重新開啟整合終端機，再以版本指令重新偵測；不要假設 PATH、管理員權限或 MDM 都可用。

完整偵測契約、官方來源、替代方案與取捨見：[研究結果](../research/01-toolchain-install-win-mac.md)。
