import architectureData from './architecture.json';
import interiorData from './interior.json';
import landscapeData from './landscape.json';

// 把三个文件打包成一个总的字典库
export const allProjectsData: Record<string, any> = {
  'architecture': architectureData,
  'interior': interiorData,
  'landscape': landscapeData
};

// 默认列出我们所有的顶部分类导航
export const navTabs = [
  { id: 'interior', name: '室内设计', icon: '🏠' },
  { id: 'architecture', name: '工装设计', icon: '🏛' },
  { id: 'landscape', name: '景观设计', icon: '🌳' }
];