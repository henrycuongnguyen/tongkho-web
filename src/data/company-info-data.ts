/**
 * Company Information Data
 * Centralized data for About/Introduction page
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  description?: string;
}

export interface Achievement {
  id: string;
  value: string;
  label: string;
  icon: 'home' | 'check' | 'users' | 'calendar' | 'trending' | 'star';
}

export const companyInfo = {
  name: 'RESA HOLDINGS',
  shortName: 'TongkhoBDS',
  tagline: 'Tổng kho bất động sản lớn nhất Việt Nam',
  description: `TongkhoBDS.com là nền tảng công nghệ bất động sản hàng đầu Việt Nam,
    kết nối hàng triệu người mua, người bán và nhà đầu tư trên khắp cả nước.
    Với công nghệ tiên tiến và dữ liệu được cập nhật liên tục,
    chúng tôi giúp bạn tìm kiếm bất động sản phù hợp một cách nhanh chóng và hiệu quả.`,
  longDescription: `Được thành lập từ năm 2015, TongkhoBDS đã trở thành một trong những nền tảng
    bất động sản được tin dùng nhất tại Việt Nam. Chúng tôi tự hào là cầu nối giữa hàng triệu
    người tìm mua, thuê bất động sản với các chủ sở hữu và nhà đầu tư uy tín.

    Với đội ngũ hơn 200 nhân viên chuyên nghiệp và mạng lưới đối tác rộng khắp 63 tỉnh thành,
    TongkhoBDS cam kết mang đến trải nghiệm tìm kiếm bất động sản tốt nhất cho người dùng.`,
  founded: 2015,
  address: 'Tầng 7, tòa nhà Văn Hoa, số 51 Kim Mã, Phường Ngọc Khánh, Quận Ba Đình, Thành phố Hà Nội',
  phone: '0965324969',
  hotline: '1900 98 89 98',
  email: 'cskh@tongkhobds.com',
  representative: 'Vương Đình Công',
};

export const missionVision = {
  mission: {
    title: 'Sứ mệnh',
    content: `Kết nối người mua và người bán bất động sản một cách minh bạch,
      hiệu quả và an toàn. Chúng tôi cam kết xây dựng một thị trường bất động sản
      công bằng, nơi mọi người đều có cơ hội tiếp cận thông tin chính xác và
      đưa ra quyết định đúng đắn.`,
    icon: 'target',
  },
  vision: {
    title: 'Tầm nhìn',
    content: `Trở thành nền tảng công nghệ bất động sản số 1 Đông Nam Á,
      tiên phong trong việc ứng dụng AI và Big Data để mang đến trải nghiệm
      tìm kiếm và giao dịch bất động sản thông minh, tiện lợi nhất cho người dùng.`,
    icon: 'eye',
  },
};

export const coreValues = [
  {
    id: '1',
    title: 'Minh bạch',
    description: 'Thông tin chính xác, rõ ràng, không gian lận',
    icon: 'shield',
  },
  {
    id: '2',
    title: 'Chuyên nghiệp',
    description: 'Đội ngũ được đào tạo bài bản, hỗ trợ tận tình',
    icon: 'briefcase',
  },
  {
    id: '3',
    title: 'Đổi mới',
    description: 'Không ngừng cải tiến công nghệ và dịch vụ',
    icon: 'lightbulb',
  },
  {
    id: '4',
    title: 'Khách hàng là trung tâm',
    description: 'Mọi quyết định đều hướng đến lợi ích khách hàng',
    icon: 'heart',
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Vương Đình Công',
    role: 'Giám đốc điều hành',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    description: 'Hơn 15 năm kinh nghiệm trong lĩnh vực bất động sản',
  },
  {
    id: '2',
    name: 'Nguyễn Thị Hương',
    role: 'Giám đốc Kinh doanh',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    description: 'Chuyên gia phát triển thị trường và quan hệ đối tác',
  },
  {
    id: '3',
    name: 'Trần Văn Minh',
    role: 'Giám đốc Công nghệ',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    description: 'Kiến trúc sư phần mềm với 12 năm kinh nghiệm',
  },
  {
    id: '4',
    name: 'Lê Thị Mai',
    role: 'Giám đốc Marketing',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    description: 'Chuyên gia truyền thông và xây dựng thương hiệu',
  },
];

export const achievements: Achievement[] = [
  {
    id: '1',
    value: '50,000+',
    label: 'Tin đăng',
    icon: 'home',
  },
  {
    id: '2',
    value: '10,000+',
    label: 'Giao dịch thành công',
    icon: 'check',
  },
  {
    id: '3',
    value: '5,000+',
    label: 'Đối tác tin cậy',
    icon: 'users',
  },
  {
    id: '4',
    value: '10+',
    label: 'Năm kinh nghiệm',
    icon: 'calendar',
  },
];

export const milestones = [
  { year: 2015, event: 'Thành lập công ty với 5 thành viên' },
  { year: 2017, event: 'Ra mắt phiên bản website đầu tiên' },
  { year: 2019, event: 'Đạt 1 triệu lượt truy cập/tháng' },
  { year: 2021, event: 'Mở rộng ra 63 tỉnh thành' },
  { year: 2023, event: 'Ra mắt ứng dụng di động' },
  { year: 2025, event: 'Đạt 50,000+ tin đăng hoạt động' },
];
