import { create } from 'zustand';

const CAFFEINE_THEMES = [
  { threshold: 0,    label: 'Serene',        vars: { '--bg':'#EDF4F9','--surface':'#FFFFFF','--surface2':'#DCE8F2','--border':'#B8D4E8','--text-primary':'#0E2434','--text-sec':'#2C5870','--text-muted':'#6898B0','--accent':'#2A8FAB','--accent-bg':'#C8E4F0','--chart-bar':'rgba(42,143,171,0.85)','--chart-hover':'rgba(25,120,148,1)','--grid':'#D5E8F0','--tooltip-bg':'#FFFFFF','--tooltip-bd':'#B8D4E8','--shadow':'0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)' } },
  { threshold: 100,  label: 'Normal',        vars: { '--bg':'#FAF7F4','--surface':'#FFFFFF','--surface2':'#F4EDE6','--border':'#E8DDD3','--text-primary':'#1C1410','--text-sec':'#6B5A4E','--text-muted':'#A08878','--accent':'#7C4A2D','--accent-bg':'#EDE0D6','--chart-bar':'rgba(124,74,45,0.85)','--chart-hover':'rgba(111,59,30,1)','--grid':'#EFE5DC','--tooltip-bg':'#FFFFFF','--tooltip-bd':'#E8DDD3','--shadow':'0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.05)' } },
  { threshold: 300,  label: '⚠ Approaching', vars: { '--bg':'#FDF8EA','--surface':'#FFFEF5','--surface2':'#FBF2C8','--border':'#F0E088','--text-primary':'#1A1000','--text-sec':'#7A6005','--text-muted':'#A89035','--accent':'#CC8A03','--accent-bg':'#FAF0BC','--chart-bar':'rgba(204,138,3,0.85)','--chart-hover':'rgba(174,115,0,1)','--grid':'#F5E89E','--tooltip-bg':'#FEFEF5','--tooltip-bd':'#F0E088','--shadow':'0 1px 3px rgba(100,80,0,.08), 0 4px 12px rgba(100,80,0,.06)' } },
  { threshold: 400,  label: '🚨 Critical',   vars: { '--bg':'#FDF5F5','--surface':'#FFFFFF','--surface2':'#FAE6E6','--border':'#F0BCBC','--text-primary':'#280808','--text-sec':'#903030','--text-muted':'#B07070','--accent':'#C0392B','--accent-bg':'#FAD2D2','--chart-bar':'rgba(192,57,43,0.85)','--chart-hover':'rgba(165,38,28,1)','--grid':'#F5D4D4','--tooltip-bg':'#FFF8F8','--tooltip-bd':'#F0BCBC','--shadow':'0 1px 3px rgba(150,0,0,.1), 0 4px 12px rgba(150,0,0,.08)' } },
  { threshold: 500,  label: '🔥 Overdrive',  vars: { '--bg':'#1E0A04','--surface':'#280E06','--surface2':'#341508','--border':'#5A2A10','--text-primary':'#FFD5B0','--text-sec':'#FF9050','--text-muted':'#904828','--accent':'#FF5C14','--accent-bg':'#4A1805','--chart-bar':'rgba(255,92,20,0.85)','--chart-hover':'rgba(255,135,65,1)','--grid':'#3A1A08','--tooltip-bg':'#1E0A04','--tooltip-bd':'#5A2A10','--shadow':'0 1px 4px rgba(0,0,0,.55), 0 4px 14px rgba(255,80,20,.18)' } },
  { threshold: 600,  label: '⚡ Chaos',      vars: { '--bg':'#120820','--surface':'#18102A','--surface2':'#201535','--border':'#3A2060','--text-primary':'#E8CCFF','--text-sec':'#B070E0','--text-muted':'#6040A0','--accent':'#B040F0','--accent-bg':'#2A1050','--chart-bar':'rgba(176,64,240,0.85)','--chart-hover':'rgba(205,105,255,1)','--grid':'#281845','--tooltip-bg':'#120820','--tooltip-bd':'#3A2060','--shadow':'0 1px 4px rgba(0,0,0,.65), 0 4px 14px rgba(140,40,220,.2)' } },
  { threshold: 700,  label: '⚡ Wired',       vars: { '--bg':'#00161A','--surface':'#001E24','--surface2':'#00282E','--border':'#004555','--text-primary':'#80F8FF','--text-sec':'#00C8D8','--text-muted':'#006070','--accent':'#00F0FF','--accent-bg':'#001C22','--chart-bar':'rgba(0,240,255,0.85)','--chart-hover':'rgba(80,255,255,1)','--grid':'#003040','--tooltip-bg':'#00161A','--tooltip-bd':'#004555','--shadow':'0 1px 4px rgba(0,0,0,.8), 0 4px 16px rgba(0,220,240,.22)' } },
  { threshold: 800,  label: '☢ Toxic',       vars: { '--bg':'#140010','--surface':'#1C0016','--surface2':'#280020','--border':'#4A0040','--text-primary':'#FF88D8','--text-sec':'#D5008A','--text-muted':'#7A0050','--accent':'#FF0090','--accent-bg':'#300018','--chart-bar':'rgba(255,0,144,0.85)','--chart-hover':'rgba(255,80,185,1)','--grid':'#2E0020','--tooltip-bg':'#140010','--tooltip-bd':'#4A0040','--shadow':'0 1px 4px rgba(0,0,0,.8), 0 4px 16px rgba(255,0,130,.22)' } },
  { threshold: 900,  label: '💀 Inferno',    vars: { '--bg':'#0C0101','--surface':'#180202','--surface2':'#220404','--border':'#500808','--text-primary':'#FFB090','--text-sec':'#FF5020','--text-muted':'#A03010','--accent':'#FF2800','--accent-bg':'#300404','--chart-bar':'rgba(255,40,0,0.85)','--chart-hover':'rgba(255,88,38,1)','--grid':'#2A0404','--tooltip-bg':'#0C0101','--tooltip-bd':'#500808','--shadow':'0 1px 4px rgba(0,0,0,.8), 0 4px 16px rgba(255,30,0,.22)' } },
  { threshold: 1000, label: '⬛ Gone',        vars: { '--bg':'#F3F3F3','--surface':'#FFFFFF','--surface2':'#E8E8E8','--border':'#CCCCCC','--text-primary':'#111111','--text-sec':'#555555','--text-muted':'#999999','--accent':'#444444','--accent-bg':'#DDDDDD','--chart-bar':'rgba(68,68,68,0.85)','--chart-hover':'rgba(36,36,36,1)','--grid':'#E0E0E0','--tooltip-bg':'#FFFFFF','--tooltip-bd':'#CCCCCC','--shadow':'0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.05)' } },
];

export { CAFFEINE_THEMES };

interface ThemeState {
  levelIndex: number;
  label: string;
  applyTheme: (todayCaffeine: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  levelIndex: 0,
  label: 'Serene',
  applyTheme: (todayCaffeine: number) => {
    let idx = 0;
    for (let i = 0; i < CAFFEINE_THEMES.length; i++) {
      if (todayCaffeine >= CAFFEINE_THEMES[i].threshold) idx = i;
    }
    const theme = CAFFEINE_THEMES[idx];
    const root = document.documentElement;
    for (const [k, v] of Object.entries(theme.vars)) {
      root.style.setProperty(k, v);
    }
    set({ levelIndex: idx, label: theme.label });
  },
}));
