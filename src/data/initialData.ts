import { Product, Category, RecyclingStage, CompanySettings } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_granules',
    name: 'خامات مخرزة (Pellets)',
    nameEn: 'Plastic Granules & Pellets',
    slug: 'granules',
    description: 'حبيبات بلاستيكية مخرزة مفلترة ومصنعة بأحدث إكسترودرات الشد والفلترة المزدوجة.',
    displayOrder: 1
  },
  {
    id: 'cat_flakes',
    name: 'خامات مجروشة ومغسولة (Flakes)',
    nameEn: 'Washed Flakes & Regrind',
    slug: 'flakes',
    description: 'كسر ورقائق بلاستيك مغسولة ومجففة حرارياً ومفروزة حسب الكثافة واللون.',
    displayOrder: 2
  },
  {
    id: 'cat_compounded',
    name: 'خامات بلور ومعالجة (Compounded)',
    nameEn: 'Compounded & Crystal Resins',
    slug: 'compounded',
    description: 'خامات بوليمر مدعمة ومعدلة بالبوليمرات الأولية لتحسين الصلابة والمرونة ومقاومة الصدمات.',
    displayOrder: 3
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_pp_granules_green',
    name: 'حبيبات بولي بروبلين PP مخرزة — أخضر زمردي',
    nameEn: 'Recycled PP Granules - Emerald Green',
    sku: 'KP-PP-GR01',
    categoryId: 'cat_granules',
    polymerType: 'PP',
    color: 'أخضر زمردي',
    form: 'حبيبات مخرزة',
    mfi: '12 - 15 g/10min',
    density: '0.91 g/cm³',
    tensileStrength: '28 MPa',
    meshFilter: '100 Mesh مزدوج',
    moisture: '< 0.15%',
    packaging: 'أكياس منسوجة 25 كجم أو جامبو 1 طن',
    minOrderQuantity: '1 طن',
    stockStatus: 'in_stock',
    price: '',
    priceUnit: 'طن',
    description: 'خامة بولي بروبلين معاد تدويرها ومخرزة بدرجة تجانس ونقاء عالية جداً، مأخوذة من خردة نقية مفروزة، مزودة بمثبتات حرارية لضمان استقرار الانصهار أثناء الحقن.',
    applications: 'صناديق الخضار والفاكهة، الكراسي البلاستيكية، قواعد الأثاث، العبوات الصناعية، الأدوات المنزلية المتينة.',
    mainImageUrl: '/src/assets/images/plastic_granules_macro_1793299426156.jpg',
    isPublished: true,
    createdAt: '2026-01-15T09:00:00.000Z'
  },
  {
    id: 'prod_hdpe_flakes_sorted',
    name: 'رقائق بولي إيثيلين عالي الكثافة HDPE مجروشة ومغسولة',
    nameEn: 'Washed HDPE Flakes Multi-Color',
    sku: 'KP-HDPE-FL02',
    categoryId: 'cat_flakes',
    polymerType: 'HDPE',
    color: 'ألوان مفروزة (أزرق / أبيض / أخضر)',
    form: 'رقائق مجروشة (Flakes)',
    mfi: '0.8 - 1.2 g/10min (Blow Grade)',
    density: '0.95 g/cm³',
    tensileStrength: '24 MPa',
    meshFilter: 'غسيل ميكانيكي حوض عائم',
    moisture: '< 0.3%',
    packaging: 'أكياس جامبو معلقة 1000 كجم',
    minOrderQuantity: '2 طن',
    stockStatus: 'in_stock',
    price: '',
    priceUnit: 'طن',
    description: 'كسر وركاب HDPE ناتج عن جريدل وجراكن وبراميل منظفات ومياه، مغسول بالماء الساخن ومفرغ من كافة الملصقات والأوساخ ومجفف حرارياً.',
    applications: 'إعادة التخريز، إنتاج جراكن الكيماويات والزيوت، خراطيم الري والمواسير الزراعية، المنصات البلاستيكية.',
    mainImageUrl: '/src/assets/images/recycled_flakes_sorting_1793299427604.jpg',
    isPublished: true,
    createdAt: '2026-01-20T10:30:00.000Z'
  },
  {
    id: 'prod_pp_black_extruded',
    name: 'حبيبات بولي بروبلين PP مخرزة أسود صلب للحقن',
    nameEn: 'Recycled PP Granules - Carbon Black',
    sku: 'KP-PP-BK03',
    categoryId: 'cat_granules',
    polymerType: 'PP',
    color: 'أسود فحمي منتظم',
    form: 'حبيبات مخرزة',
    mfi: '10 - 14 g/10min',
    density: '0.92 g/cm³',
    tensileStrength: '26 MPa',
    meshFilter: '120 Mesh دقيق',
    moisture: '< 0.1%',
    packaging: 'أكياس بولي بروبلين مبطنة 25 كجم',
    minOrderQuantity: '1 طن',
    stockStatus: 'in_stock',
    price: '',
    priceUnit: 'طن',
    description: 'حبيبات سوداء معالجة بالكربون بلاك المركز ومفلترة عبر فلاتر شبكية 120 لضمان خلوها التام من الشوائب والغازات، تعطي سطحاً لامعاً وأداءً ميكانيكياً متميزاً.',
    applications: 'بطاريات السيارات، أغطية المحركات، الشماعات، قواعد الكراسي، علب الكهرباء والتقسيم.',
    mainImageUrl: '/src/assets/images/extrusion_granulation_line_1793299428713.jpg',
    isPublished: true,
    createdAt: '2026-02-01T11:00:00.000Z'
  },
  {
    id: 'prod_ldpe_film_pellets',
    name: 'حبيبات بولي إيثيلين منخفض الكثافة LDPE لسحب الأفلام',
    nameEn: 'Recycled LDPE Film Grade Pellets',
    sku: 'KP-LDPE-NT04',
    categoryId: 'cat_compounded',
    polymerType: 'LDPE',
    color: 'طبيعي شفاف / حليبي',
    form: 'حبيبات بلور ومعالجة',
    mfi: '1.8 - 2.4 g/10min',
    density: '0.923 g/cm³',
    tensileStrength: '18 MPa',
    meshFilter: '100 Mesh هيدروليكي',
    moisture: '< 0.08%',
    packaging: 'أكياس 25 كجم معالجة ضد الرطوبة',
    minOrderQuantity: '1 طن',
    stockStatus: 'on_demand',
    price: '',
    priceUnit: 'طن',
    description: 'خامة LDPE ناتجة عن تدوير رول وأكياس الشفاشيف والأفلام الزراعية والصناعية النظيفة، تتميز بمرونة عالية واستطالة ممتازة عند السحب.',
    applications: 'أفلام التغليف الصناعي، الأكياس الثقيلة، رقائق البناء العازلة، الخراطيم المرنة، تبطين الحاويات.',
    mainImageUrl: '/src/assets/images/plastic_granules_macro_1793299426156.jpg',
    isPublished: true,
    createdAt: '2026-02-10T14:15:00.000Z'
  },
  {
    id: 'prod_hdpe_pipe_grade',
    name: 'حبيبات HDPE معالجة لسحب مواسير الصرف وخراطيم الري',
    nameEn: 'Compounded HDPE Pipe Grade Pellets',
    sku: 'KP-HDPE-PP05',
    categoryId: 'cat_compounded',
    polymerType: 'HDPE',
    color: 'أسود معالج UV',
    form: 'حبيبات مخرزة ومعالجة',
    mfi: '0.4 - 0.7 g/10min',
    density: '0.948 g/cm³',
    tensileStrength: '22 MPa',
    meshFilter: '120 Mesh',
    moisture: '< 0.1%',
    packaging: 'جامبو باج 1 طن',
    minOrderQuantity: '3 طن',
    stockStatus: 'in_stock',
    price: '',
    priceUnit: 'طن',
    description: 'خامة HDPE مخصصة ومطورة بإضافات مثبتة ضد الأشعة فوق البنفسجية لضمان عمر تشغيلي طويل ومقاومة ممتازة للضغط والتمزق الهيدروليكي.',
    applications: 'مواسير الصرف والري الزراعي، كبائن الاتصالات تحت الأرض، أقطاب التثبيت البلاستيكية.',
    mainImageUrl: '/src/assets/images/extrusion_granulation_line_1793299428713.jpg',
    isPublished: true,
    createdAt: '2026-02-15T08:00:00.000Z'
  }
];

export const INITIAL_RECYCLING_STAGES: RecyclingStage[] = [
  {
    id: 'stage_1',
    title: 'استلام وفرز السكراب والخامات الأولية',
    description: 'فحص المواد الواردة من مخلفات الأكياس المنسوجة والبكر الصناعي وتصنيفها بدقة לפי نوع البوليمر (PP, HDPE, LDPE) وعزل الشوائب والمعادن لضمان جودة الخامة.',
    order: 1,
    imageUrl: '/src/assets/images/recycled_flakes_sorting_1793299427604.jpg',
    active: true
  },
  {
    id: 'stage_2',
    title: 'الجرش والتقطيع الدقيق (Crushing)',
    description: 'تغذية المواد المفروزة إلى كسارات صناعية ثقيلة مجهزة بسكاكين فولاذية مقواة لتقطيع البلاستيك إلى رقائق متجانسة الحجم تضمن فاعلية الغسيل اللاحق.',
    order: 2,
    imageUrl: '/src/assets/images/recycled_flakes_sorting_1793299427604.jpg',
    active: true
  },
  {
    id: 'stage_3',
    title: 'الغسيل الميكانيكي والفصل الكثافي',
    description: 'معالجة الرقائق في أحواض غسيل متتالية بالماء الساخن ومنظفات صناعية للتخلص من الأتربة والزيوت، مع الفصل الكثافي لترسيب البوليمرات الثقيلة والشوائب.',
    order: 3,
    imageUrl: '/src/assets/images/hero_industrial_recycling_1793299426013.jpg',
    active: true
  },
  {
    id: 'stage_4',
    title: 'التجفيف الحراري والطرد المركزي',
    description: 'سحب المياه عبر أجهزة طرد مركزي فائقة السرعة تليها مجففات هوائية ساخنة لخفض الرطوبة إلى أقل من 0.15%، وهي نسبة حاسمة لمنع حدوث فقاعات أثناء البثق.',
    order: 4,
    imageUrl: '/src/assets/images/hero_industrial_recycling_1793299426013.jpg',
    active: true
  },
  {
    id: 'stage_5',
    title: 'البثق وتخريز الحبيبات (Extrusion & Pelletizing)',
    description: 'صهر البلاستيك في إكسترودر مزدوج بحرارة مضبوطة ومفلتر بشبكات مزدوجة Mesh 100/120، ثم سحب الشعيرات وتبريدها وتقطيعها آلياً لحبيبات كروية موحدة.',
    order: 5,
    imageUrl: '/src/assets/images/extrusion_granulation_line_1793299428713.jpg',
    active: true
  },
  {
    id: 'stage_6',
    title: 'مراقبة الجودة، التحليل المخبري، والتعبئة',
    description: 'إجراء اختبارات السيولة MFI والكثافة وقوة الشد في معمل المصنع، وتعبئة الحبيبات المعتمدة في أكياس 25 كجم أو أكياس جامبو معقمة جاهزة للشحن الصناعي.',
    order: 6,
    imageUrl: '/src/assets/images/plastic_granules_macro_1793299426156.jpg',
    active: true
  }
];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyNameAr: 'الكينج بلاست لتجارة وتدوير خامات البلاستيك',
  companyNameEn: 'KING PLAST For Recycled Raw Materials',
  phone: '+20 10 9876 5432',
  whatsappNumber: '+20 10 9876 5432',
  email: 'sales@kingplast-eg.com',
  factoryAddress: 'جمهورية مصر العربية — المنطقة الصناعية، مدينة العاشر من رمضان',
  workingHours: 'السبت - الخميس: 8:00 صباحاً - 5:00 مساءً (الجمعة عطلة)',
  taglineAr: 'من إعادة التدوير إلى خامات تصنع المستقبل',
  secondaryTaglineAr: 'خامات بلاستيك صناعية — جودة، توريد، وثقة'
};
