import type {
  Property,
  Project,
  NewsArticle,
  Location,
} from "@/types/property";

// Mock data for properties
export const mockPropertiesForSale: Property[] = [
  {
    id: "1",
    title: "Nhà phố sang trọng Tây Hồ, Nhà 4 tầng x 65m2, MT 4.5m",
    slug: "nha-pho-tay-ho-4-tang-65m2",
    type: "house",
    transactionType: "sale",
    price: 8.5,
    priceUnit: "billion",
    area: 65,
    bedrooms: 4,
    bathrooms: 4,
    address: "Ngõ 168, Đường Lạc Long Quân",
    district: "Tây Hồ",
    city: "Hà Nội",
    description: "Nhà phố đẹp, thiết kế hiện đại, nội thất cao cấp",
    images: ["/images/properties/prop-1.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    features: ["Ô tô đỗ cửa", "Nội thất cao cấp", "Sổ đỏ chính chủ"],
    createdAt: "2026-01-25",
    isFeatured: true,
    isHot: true,
  },
  {
    id: "2",
    title: "Bán căn hộ chung cư cao cấp 3PN, View Hồ Tây",
    slug: "can-ho-3pn-view-ho-tay",
    type: "apartment",
    transactionType: "sale",
    price: 4.2,
    priceUnit: "billion",
    area: 98,
    bedrooms: 3,
    bathrooms: 2,
    address: "Tòa D' Le Pont D'or",
    district: "Tây Hồ",
    city: "Hà Nội",
    description: "Căn hộ cao cấp view Hồ Tây, full nội thất",
    images: ["/images/properties/prop-2.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    features: ["View Hồ Tây", "Full nội thất", "3 phòng ngủ"],
    createdAt: "2026-01-24",
    isFeatured: false,
    isHot: true,
  },
  {
    id: "3",
    title: "Biệt thự liền kề Vinhomes Riverside, Long Biên",
    slug: "biet-thu-vinhomes-riverside-long-bien",
    type: "villa",
    transactionType: "sale",
    price: 25,
    priceUnit: "billion",
    area: 200,
    bedrooms: 5,
    bathrooms: 5,
    address: "Vinhomes Riverside",
    district: "Long Biên",
    city: "Hà Nội",
    description: "Biệt thự đẳng cấp, khuôn viên rộng, an ninh 24/7",
    images: ["/images/properties/prop-3.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
    features: ["Khuôn viên rộng", "Hồ bơi riêng", "An ninh 24/7"],
    createdAt: "2026-01-23",
    isFeatured: true,
    isHot: false,
  },
  {
    id: "4",
    title: "Đất nền dự án FLC Sầm Sơn, vị trí đẹp",
    slug: "dat-nen-flc-sam-son",
    type: "land",
    transactionType: "sale",
    price: 1.8,
    priceUnit: "billion",
    area: 120,
    address: "FLC Sầm Sơn",
    district: "Sầm Sơn",
    city: "Thanh Hóa",
    description: "Đất nền view biển, pháp lý rõ ràng",
    images: ["/images/properties/prop-4.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    features: ["View biển", "Pháp lý rõ ràng", "Đầu tư sinh lời"],
    createdAt: "2026-01-22",
    isFeatured: false,
    isHot: false,
  },
];

export const mockPropertiesForRent: Property[] = [
  {
    id: "5",
    title: "Cho thuê căn hộ Studio Vinhomes Ocean Park",
    slug: "cho-thue-studio-vinhomes-ocean-park",
    type: "apartment",
    transactionType: "rent",
    price: 6,
    priceUnit: "per_month",
    area: 35,
    bedrooms: 1,
    bathrooms: 1,
    address: "Vinhomes Ocean Park",
    district: "Gia Lâm",
    city: "Hà Nội",
    description: "Studio đầy đủ tiện nghi, view đẹp",
    images: ["/images/properties/prop-5.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    features: ["Full nội thất", "Tiện ích đầy đủ", "An ninh"],
    createdAt: "2026-01-26",
    isFeatured: false,
    isHot: true,
  },
  {
    id: "6",
    title: "Cho thuê nhà nguyên căn Cầu Giấy, 4 tầng x 50m2",
    slug: "cho-thue-nha-nguyen-can-cau-giay",
    type: "house",
    transactionType: "rent",
    price: 18,
    priceUnit: "per_month",
    area: 50,
    bedrooms: 4,
    bathrooms: 4,
    address: "Ngõ 1, Duy Tân",
    district: "Cầu Giấy",
    city: "Hà Nội",
    description: "Nhà 4 tầng, ô tô đỗ cửa, phù hợp văn phòng",
    images: ["/images/properties/prop-6.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop",
    features: ["Ô tô đỗ cửa", "Phù hợp văn phòng", "Mặt ngõ rộng"],
    createdAt: "2026-01-25",
    isFeatured: false,
    isHot: false,
  },
  {
    id: "7",
    title: "Cho thuê văn phòng hạng A tại Keangnam Landmark",
    slug: "cho-thue-van-phong-keangnam",
    type: "office",
    transactionType: "rent",
    price: 450000,
    priceUnit: "VND",
    area: 200,
    address: "Keangnam Landmark 72",
    district: "Nam Từ Liêm",
    city: "Hà Nội",
    description: "Văn phòng hạng A, view đẹp, tiện ích đầy đủ",
    images: ["/images/properties/prop-7.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    features: ["Văn phòng hạng A", "View thành phố", "Bãi đỗ xe"],
    createdAt: "2026-01-24",
    isFeatured: true,
    isHot: false,
  },
  {
    id: "8",
    title: "Cho thuê kho xưởng KCN Bắc Thăng Long",
    slug: "cho-thue-kho-xuong-bac-thang-long",
    type: "warehouse",
    transactionType: "rent",
    price: 80000,
    priceUnit: "VND",
    area: 1000,
    address: "KCN Bắc Thăng Long",
    district: "Đông Anh",
    city: "Hà Nội",
    description: "Kho xưởng mới xây, PCCC đầy đủ",
    images: ["/images/properties/prop-8.jpg"],
    thumbnail:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
    features: ["PCCC đầy đủ", "Container vào được", "Điện 3 pha"],
    createdAt: "2026-01-23",
    isFeatured: false,
    isHot: false,
  },
];

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "The Grand Harbor",
    slug: "the-grand-harbor",
    developer: "Masterise Homes",
    location: "Quận 1",
    city: "TP. Hồ Chí Minh",
    status: "selling",
    totalUnits: 2500,
    priceRange: "8 - 25 tỷ",
    area: "5.8 ha",
    description: "Dự án căn hộ cao cấp tại vị trí đắc địa trung tâm Quận 1",
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop",
    ],
    thumbnail:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop",
    amenities: [
      "Hồ bơi vô cực",
      "Gym & Spa",
      "Sky Garden",
      "Trường học quốc tế",
    ],
    completionDate: "2027-Q4",
    towers: 10,
    isFeatured: true,
  },
  {
    id: "2",
    name: "Vinhomes Ocean Park 3",
    slug: "vinhomes-ocean-park-3",
    developer: "Vinhomes",
    location: "Văn Giang",
    city: "Hưng Yên",
    status: "selling",
    totalUnits: 4500,
    priceRange: "1.5 - 8 tỷ",
    area: "294 ha",
    description:
      "Đại đô thị biển hồ với hệ sinh thái tiện ích đẳng cấp quốc tế",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=450&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop",
    ],
    thumbnail:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop",
    amenities: [
      "Biển hồ nhân tạo",
      "Công viên chủ đề",
      "Trung tâm thương mại",
      "Bệnh viện",
    ],
    completionDate: "2026-Q2",
    towers: 25,
    isFeatured: true,
  },
  {
    id: "3",
    name: "Ecopark Sky Oasis",
    slug: "ecopark-sky-oasis",
    developer: "Ecopark",
    location: "Văn Giang",
    city: "Hưng Yên",
    status: "selling",
    totalUnits: 1800,
    priceRange: "2 - 6 tỷ",
    area: "12.5 ha",
    description: "Tổ hợp căn hộ resort giữa lòng khu đô thị xanh Ecopark",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=450&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop",
    ],
    thumbnail:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop",
    amenities: ["Hồ bơi tràn", "Sky Bar", "Gym cao cấp", "Sân golf mini"],
    completionDate: "2026-Q4",
    towers: 5,
    isFeatured: false,
  },
];

export const mockNews: NewsArticle[] = [
  {
    id: "1",
    title: "Thị trường bất động sản Việt Nam năm 2026: Những xu hướng mới",
    slug: "thi-truong-bds-viet-nam-2026-xu-huong-moi",
    excerpt:
      "Khám phá những xu hướng bất động sản nổi bật trong năm 2026 và cơ hội đầu tư tiềm năng...",
    content: `<p>Năm 2026 đánh dấu một bước ngoặt quan trọng trong thị trường bất động sản Việt Nam với nhiều xu hướng mới nổi bật. Từ sự phục hồi mạnh mẽ sau giai đoạn điều chỉnh đến những thay đổi trong nhu cầu của người mua, thị trường đang cho thấy những tín hiệu tích cực.</p>

<h2>1. Phân khúc nhà ở bình dân tăng trưởng mạnh</h2>
<p>Với các chính sách hỗ trợ từ Chính phủ và nhu cầu thực của người dân, phân khúc nhà ở giá rẻ và trung cấp đang trở thành điểm sáng của thị trường. Nhiều chủ đầu tư đã chuyển hướng sang phát triển các dự án phù hợp với túi tiền của đa số người dân.</p>

<h2>2. Xu hướng "xanh hóa" bất động sản</h2>
<p>Các dự án bất động sản xanh, thân thiện với môi trường ngày càng được ưa chuộng. Người mua nhà hiện đại không chỉ quan tâm đến giá cả và vị trí mà còn chú trọng đến các tiêu chí bền vững như tiết kiệm năng lượng, không gian xanh và vật liệu xây dựng thân thiện.</p>

<h2>3. Công nghệ PropTech bùng nổ</h2>
<p>Ứng dụng công nghệ trong bất động sản đang thay đổi cách người mua tìm kiếm và giao dịch. Từ tour 3D, thực tế ảo đến các nền tảng môi giới trực tuyến, PropTech đang tạo ra cuộc cách mạng trong ngành.</p>

<h2>4. Khu vực vệ tinh phát triển</h2>
<p>Với giá đất tại các thành phố lớn ngày càng tăng, nhiều người mua đang chuyển hướng sang các khu vực vệ tinh. Các tỉnh như Bình Dương, Long An, Hưng Yên đang trở thành điểm đến hấp dẫn với hạ tầng giao thông ngày càng hoàn thiện.</p>

<h2>Kết luận</h2>
<p>Thị trường bất động sản 2026 hứa hẹn nhiều cơ hội cho cả nhà đầu tư và người mua để ở. Việc nắm bắt đúng xu hướng sẽ giúp bạn đưa ra những quyết định đầu tư thông minh.</p>`,
    thumbnail:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop",
    category: "market",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-26",
    views: 1250,
  },
  {
    id: "2",
    title: "Hướng dẫn mua nhà lần đầu cho người trẻ",
    slug: "huong-dan-mua-nha-lan-dau-cho-nguoi-tre",
    excerpt:
      "Những kinh nghiệm và lời khuyên hữu ích cho những ai đang có kế hoạch mua nhà lần đầu...",
    content: `<p>Mua nhà lần đầu là một cột mốc quan trọng trong cuộc đời. Tuy nhiên, với giá bất động sản ngày càng tăng, người trẻ cần có sự chuẩn bị kỹ lưỡng cả về tài chính lẫn kiến thức.</p>

<h2>1. Xác định ngân sách và khả năng tài chính</h2>
<p>Trước khi bắt đầu tìm kiếm, hãy đánh giá chính xác khả năng tài chính của bạn. Quy tắc chung là khoản vay không nên vượt quá 50% thu nhập hàng tháng. Bạn cũng cần dự trù thêm 5-10% giá trị căn nhà cho các chi phí phát sinh.</p>

<h2>2. Lựa chọn vị trí phù hợp</h2>
<p>Vị trí là yếu tố quan trọng nhất trong bất động sản. Hãy cân nhắc khoảng cách đến nơi làm việc, trường học, bệnh viện và các tiện ích xung quanh. Đừng quên kiểm tra quy hoạch tương lai của khu vực.</p>

<h2>3. Kiểm tra pháp lý cẩn thận</h2>
<p>Đây là bước không thể bỏ qua. Hãy yêu cầu xem sổ đỏ/sổ hồng gốc, kiểm tra quy hoạch, và tham khảo ý kiến của luật sư hoặc chuyên gia bất động sản trước khi ký hợp đồng.</p>

<h2>4. Đàm phán giá hiệu quả</h2>
<p>Đừng ngại đàm phán. Nghiên cứu giá thị trường, so sánh với các căn hộ tương tự, và đưa ra mức giá hợp lý. Thời điểm mua nhà cũng ảnh hưởng đến khả năng đàm phán của bạn.</p>

<h2>5. Lựa chọn ngân hàng cho vay</h2>
<p>So sánh lãi suất và điều kiện vay từ nhiều ngân hàng. Chú ý đến lãi suất ưu đãi trong năm đầu và lãi suất thả nổi sau đó. Một số ngân hàng còn có chương trình hỗ trợ đặc biệt cho người mua nhà lần đầu.</p>

<h2>Lời khuyên cuối cùng</h2>
<p>Đừng vội vàng và đừng để cảm xúc chi phối quyết định. Mua nhà là khoản đầu tư lớn, hãy dành thời gian nghiên cứu và so sánh trước khi quyết định.</p>`,
    thumbnail:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
    category: "tips",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-25",
    views: 890,
  },
  {
    id: "3",
    title: "Chính sách hỗ trợ người mua nhà ở xã hội năm 2026",
    slug: "chinh-sach-ho-tro-nguoi-mua-nha-o-xa-hoi-2026",
    excerpt:
      "Tổng hợp các chính sách mới nhất về hỗ trợ mua nhà ở xã hội dành cho người có thu nhập thấp...",
    content: `<p>Năm 2026, Chính phủ tiếp tục triển khai nhiều chính sách hỗ trợ người dân tiếp cận nhà ở xã hội với mức giá phù hợp. Dưới đây là tổng hợp các chính sách quan trọng nhất.</p>

<h2>1. Gói tín dụng 120.000 tỷ đồng</h2>
<p>Gói tín dụng ưu đãi với lãi suất thấp hơn 1,5-2% so với lãi suất thương mại dành cho người mua nhà ở xã hội. Thời hạn vay tối đa 25 năm với mức vay lên đến 80% giá trị căn hộ.</p>

<h2>2. Điều kiện được hưởng chính sách</h2>
<p>Để được mua nhà ở xã hội, người mua cần đáp ứng các điều kiện sau:</p>
<ul>
<li>Thu nhập dưới 15 triệu đồng/tháng (cá nhân) hoặc 30 triệu đồng/tháng (hộ gia đình)</li>
<li>Chưa có nhà ở hoặc có nhà ở diện tích dưới 10m²/người</li>
<li>Có hộ khẩu tại địa phương hoặc đóng BHXH tại địa phương</li>
</ul>

<h2>3. Quy trình đăng ký</h2>
<p>Người dân cần nộp hồ sơ tại UBND cấp xã/phường nơi cư trú hoặc nơi làm việc. Hồ sơ bao gồm đơn đăng ký, giấy xác nhận thu nhập, và các giấy tờ chứng minh điều kiện.</p>

<h2>4. Các dự án nhà ở xã hội nổi bật</h2>
<p>Nhiều dự án nhà ở xã hội đang được triển khai tại các thành phố lớn với giá bán từ 15-20 triệu đồng/m². Các dự án này đều đảm bảo chất lượng xây dựng và tiện ích cơ bản.</p>

<h2>Lưu ý quan trọng</h2>
<p>Người mua nhà ở xã hội không được chuyển nhượng trong 5 năm đầu. Sau 5 năm, nếu muốn bán phải hoàn trả phần ưu đãi đã được hưởng cho Nhà nước.</p>`,
    thumbnail:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop",
    category: "policy",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-24",
    views: 2100,
  },
  {
    id: "4",
    title: "Top 5 khu vực có tiềm năng tăng giá mạnh trong năm 2026",
    slug: "top-5-khu-vuc-tiem-nang-tang-gia-2026",
    excerpt:
      "Phân tích chi tiết những khu vực bất động sản được dự báo sẽ có mức tăng giá ấn tượng...",
    content: "",
    thumbnail:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
    category: "market",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-23",
    views: 3200,
  },
  {
    id: "5",
    title: "Kinh nghiệm đàm phán giá khi mua bất động sản",
    slug: "kinh-nghiem-dam-phan-gia-mua-bds",
    excerpt:
      "Bí quyết thương lượng để có được mức giá tốt nhất khi mua nhà đất từ các chuyên gia...",
    content: "",
    thumbnail:
      "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&h=300&fit=crop",
    category: "tips",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-22",
    views: 1580,
  },
  {
    id: "6",
    title: "Quy định mới về thuế chuyển nhượng bất động sản 2026",
    slug: "quy-dinh-moi-thue-chuyen-nhuong-bds-2026",
    excerpt:
      "Cập nhật những thay đổi quan trọng trong chính sách thuế bất động sản áp dụng từ 2026...",
    content: "",
    thumbnail:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    category: "policy",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-21",
    views: 4500,
  },
  {
    id: "7",
    title: "Dự án The Grand Harbor chính thức mở bán giai đoạn 2",
    slug: "the-grand-harbor-mo-ban-giai-doan-2",
    excerpt:
      "Masterise Homes công bố mở bán giai đoạn 2 với nhiều chính sách ưu đãi hấp dẫn...",
    content: "",
    thumbnail:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    category: "project_news",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-20",
    views: 2800,
  },
  {
    id: "8",
    title: "So sánh đầu tư căn hộ và đất nền: Lựa chọn nào phù hợp?",
    slug: "so-sanh-dau-tu-can-ho-va-dat-nen",
    excerpt:
      "Phân tích ưu nhược điểm của từng loại hình đầu tư để giúp bạn đưa ra quyết định đúng đắn...",
    content: "",
    thumbnail:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    category: "investment",
    folderId: null,
    folderName: null,
    author: "Admin",
    publishedAt: "2026-01-19",
    views: 1950,
  },
];

export const mockLocations: Location[] = [
  {
    id: "1",
    name: "Hà Nội",
    slug: "ha-noi",
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop",
    propertyCount: 25800,
  },
  {
    id: "2",
    name: "TP. Hồ Chí Minh",
    slug: "ho-chi-minh",
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop",
    propertyCount: 31500,
  },
  {
    id: "3",
    name: "Đà Nẵng",
    slug: "da-nang",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop",
    propertyCount: 8900,
  },
  {
    id: "4",
    name: "Thành phố Cần Thơ",
    slug: "can-tho",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop",
    propertyCount: 4500,
  },
  {
    id: "5",
    name: "An Giang",
    slug: "an-giang",
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop",
    propertyCount: 2300,
  },
  {
    id: "6",
    name: "Thừa Thiên Huế",
    slug: "thua-thien-hue",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop",
    propertyCount: 3200,
  },
  {
    id: "7",
    name: "Quảng Ninh",
    slug: "quang-ninh",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop",
    propertyCount: 4777,
  },
];

export const mockCustomerLogos = [
  { name: "Novaland", logo: "/images/customers/novaland.png" },
  { name: "Vinhomes", logo: "/images/customers/vinhomes.png" },
  { name: "Sun Group", logo: "/images/customers/sungroup.png" },
  { name: "TopHomes", logo: "/images/customers/tophomes.png" },
];
