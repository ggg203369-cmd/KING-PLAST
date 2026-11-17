import { sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  aiSettings,
  banners,
  categories,
  productImages,
  products,
  websiteSections,
  websiteSettings,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

// Authentic locally stored industrial images generated for KING PLAST
const IMG = {
  heroRecycling: '/src/assets/images/hero_industrial_recycling_1793299426013.jpg',
  granulesMacro: '/src/assets/images/plastic_granules_macro_1793299426156.jpg',
  flakesSorting: '/src/assets/images/recycled_flakes_sorting_1793299427604.jpg',
  extrusionLine: '/src/assets/images/extrusion_granulation_line_1793299428713.jpg',
  ppStudio: '/src/assets/images/pp_pellets_studio_1794908533302.jpg',
  hdpeStudio: '/src/assets/images/hdpe_granules_studio_1794908535062.jpg',
  petStudio: '/src/assets/images/pet_flakes_transparent_1794908534395.jpg',
  warehousePallets: '/src/assets/images/plastic_pallets_packaging_1794908535344.jpg',
};

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  // 1. Seed Website Settings
  const existingSettings = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM website_settings`);
  if (Number((existingSettings.rows[0] as { cnt: number })?.cnt ?? 0) === 0) {
    await db
      .insert(websiteSettings)
      .values({
        key: 'default',
        brandNameAr: 'الكينج بلاست',
        brandNameEn: 'KING PLAST',
        taglineAr: 'من إعادة التدوير إلى خامات تصنع المستقبل',
        taglineEn: 'From Recycling to Raw Materials Shaping the Future',
        primaryColor: '#4C1D95',
        accentYellow: '#FACC15',
        accentGold: '#D4AF37',
        darkPurple: '#15072E',
        defaultCurrency: 'EGP',
        usdToEgpRate: 49.5,
        supportEmail: 'sales@kingplast-eg.com',
        supportPhone: '+20 100 245 8900',
        whatsappPhone: '+20 100 245 8900',
        addressAr: 'المنطقة الصناعية الثالثة — العاشر من رمضان، الشرقية، مصر',
        addressEn: '3rd Industrial Zone — 10th of Ramadan City, Egypt',
        seoTitleAr: 'الكينج بلاست | KING PLAST — سوق خامات البلاستيك الصناعية',
        seoTitleEn: 'KING PLAST — Industrial Plastic Raw Materials Marketplace',
        seoDescAr:
          'منصة الكينج بلاست التجارية لتوريد حبيبات البلاستيك المعاد تدويرها والخامات البكر PP و HDPE و LDPE و PET و ABS.',
        seoDescEn:
          'Commercial B2B marketplace for industrial plastic granules, recycled pellets, and polymer raw materials.',
        maintenanceMode: false,
        allowPublicRegistration: true,
      })
      .onConflictDoNothing();
  }

  // 2. Seed all 13 Plastic Raw Material Categories
  const existingCats = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM categories`);
  if (Number((existingCats.rows[0] as { cnt: number })?.cnt ?? 0) === 0) {
    const categorySeed = [
      {
        slug: 'polypropylene-pp',
        nameAr: 'بولي بروبيلين (PP)',
        nameEn: 'Polypropylene (PP)',
        descriptionAr: 'حبيبات PP للحقن، السحب، الرافيا، والأفلام عالية الشفافية.',
        descriptionEn: 'Injection, raffia, extrusion, and BOPP grade PP pellets.',
        imageUrl: IMG.ppStudio,
        bannerUrl: IMG.warehousePallets,
        sortOrder: 1,
      },
      {
        slug: 'polyethylene-pe',
        nameAr: 'بولي إيثيلين (PE)',
        nameEn: 'Polyethylene (PE)',
        descriptionAr: 'خامات PE متعددة الاستخدامات للتغليف الصناعي والمواسير.',
        descriptionEn: 'Versatile PE polymer resins for packaging and industrial piping.',
        imageUrl: IMG.granulesMacro,
        bannerUrl: IMG.extrusionLine,
        sortOrder: 2,
      },
      {
        slug: 'hdpe',
        nameAr: 'بولي إيثيلين عالي الكثافة (HDPE)',
        nameEn: 'HDPE',
        descriptionAr: 'خامات النفخ والحقن والمواسير عالية الصلابة والمتانة.',
        descriptionEn: 'High-density blow molding, injection, and pipe-grade granules.',
        imageUrl: IMG.hdpeStudio,
        bannerUrl: IMG.warehousePallets,
        sortOrder: 3,
      },
      {
        slug: 'ldpe',
        nameAr: 'بولي إيثيلين منخفض الكثافة (LDPE)',
        nameEn: 'LDPE',
        descriptionAr: 'خامات تصنيع الأكياس وأفلام الشرنك والتغليف المرن.',
        descriptionEn: 'Low-density film grade for shrink wrap and heavy-duty bags.',
        imageUrl: IMG.ppStudio,
        bannerUrl: IMG.heroRecycling,
        sortOrder: 4,
      },
      {
        slug: 'lldpe',
        nameAr: 'بولي إيثيلين خطي منخفض الكثافة (LLDPE)',
        nameEn: 'LLDPE',
        descriptionAr: 'خامات سترتش فيلم والروتو مولدنج ذات مقاومة الشد العالية.',
        descriptionEn: 'Stretch film and rotomolding resins with high tensile strength.',
        imageUrl: IMG.granulesMacro,
        bannerUrl: IMG.warehousePallets,
        sortOrder: 5,
      },
      {
        slug: 'pet',
        nameAr: 'بولي إيثيلين تيريفثاليت (PET)',
        nameEn: 'PET',
        descriptionAr: 'قشور PET مغسولة ساخنة وراتنجات تصنيع العبوات والألياف.',
        descriptionEn: 'Hot-washed clear PET flakes and bottle-grade resin pellets.',
        imageUrl: IMG.petStudio,
        bannerUrl: IMG.flakesSorting,
        sortOrder: 6,
      },
      {
        slug: 'pvc',
        nameAr: 'كلوريد البولي فينيل (PVC)',
        nameEn: 'PVC',
        descriptionAr: 'خامات PVC للمواسير، الكابلات الكهربائية، والبروفيلات.',
        descriptionEn: 'Rigid and flexible PVC compounds for pipes, cables, and profiles.',
        imageUrl: IMG.extrusionLine,
        bannerUrl: IMG.warehousePallets,
        sortOrder: 7,
      },
      {
        slug: 'abs',
        nameAr: 'إيه بي إس الهندسي (ABS)',
        nameEn: 'ABS',
        descriptionAr: 'بوليمر هندسي عالي الصدمات للأجهزة المنزلية وقطع السيارات.',
        descriptionEn: 'High-impact engineering polymer for appliances and automotive parts.',
        imageUrl: IMG.petStudio,
        bannerUrl: IMG.extrusionLine,
        sortOrder: 8,
      },
      {
        slug: 'recycled-plastic-granules',
        nameAr: 'حبيبات البلاستيك المعاد تدويره',
        nameEn: 'Recycled Plastic Granules',
        descriptionAr: 'خرز بلاستيك مفلتر بدقة ومنتج على أحدث خطوط التحبيب.',
        descriptionEn: 'Precision-filtered recycled polymer granules with consistent MFI.',
        imageUrl: IMG.granulesMacro,
        bannerUrl: IMG.heroRecycling,
        sortOrder: 9,
      },
      {
        slug: 'plastic-scrap',
        nameAr: 'كسر ومخلفات البلاستيك المفروزة',
        nameEn: 'Plastic Scrap',
        descriptionAr: 'مجروش ومخلفات مصانع مفروزة ومغسولة جاهزة للتصنيع.',
        descriptionEn: 'Sorted and washed industrial plastic regrind and scrap.',
        imageUrl: IMG.flakesSorting,
        bannerUrl: IMG.heroRecycling,
        sortOrder: 10,
      },
      {
        slug: 'plastic-raw-materials',
        nameAr: 'خامات البلاستيك الأولية',
        nameEn: 'Plastic Raw Materials',
        descriptionAr: 'توريد خامات البوليمر البكر والمستوردة بشهادات جودة.',
        descriptionEn: 'Certified virgin polymer raw materials with COA.',
        imageUrl: IMG.warehousePallets,
        bannerUrl: IMG.warehousePallets,
        sortOrder: 11,
      },
      {
        slug: 'industrial-plastic-materials',
        nameAr: 'المواد البلاستيكية الصناعية',
        nameEn: 'Industrial Plastic Materials',
        descriptionAr: 'بوليمرات متخصصة للخطوط الإنتاجية الثقيلة والتعبئة.',
        descriptionEn: 'Heavy-duty industrial polymers for high-throughput manufacturing.',
        imageUrl: IMG.extrusionLine,
        bannerUrl: IMG.extrusionLine,
        sortOrder: 12,
      },
      {
        slug: 'other-plastic-materials',
        nameAr: 'مواد وإضافات بلاستيكية أخرى',
        nameEn: 'Other Plastic Materials',
        descriptionAr: 'ماستر باتش ألوان وإضافات تحسين الانسياب والحماية من الأشعة.',
        descriptionEn: 'Color masterbatches, UV stabilizers, and processing additives.',
        imageUrl: IMG.hdpeStudio,
        bannerUrl: IMG.heroRecycling,
        sortOrder: 13,
      },
    ];

    const insertedCategories = await db
      .insert(categories)
      .values(categorySeed)
      .onConflictDoNothing()
      .returning();

    const catBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

    // 3. Seed Authentic Industrial Products (No fake prices, discounts, or stock!)
    const existingProds = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM products`);
    if (Number((existingProds.rows[0] as { cnt: number })?.cnt ?? 0) === 0) {
      const productSeed = [
        {
          sku: 'KP-PP-101',
          categoryId: catBySlug.get('polypropylene-pp') ?? null,
          nameAr: 'حبيبات بولي بروبيلين حقن (PP Homopolymer)',
          nameEn: 'PP Homopolymer Injection Granules',
          descriptionAr:
            'خام بولي بروبيلين عالي النقاء مخصص لماكينات الحقن السريع والأدوات المنزلية والعبوات الصلبة، يتميز بثبات حراري وتوزيع متجانس للحبيبات.',
          descriptionEn:
            'High-purity polypropylene homopolymer engineered for fast-cycle injection molding, rigid packaging, and household ware.',
          materialType: 'PP',
          grade: 'Injection Grade (MFI 12–18)',
          color: 'طبيعي / شفاف (Natural)',
          weight: '25 كجم / الشكارة',
          packaging: 'شكائر منسوجة 25 كجم مبطنة + بالتات تغليف شرنك',
          technicalSpecs: {
            mfi: '14 g/10 min (230°C / 2.16 kg)',
            density: '0.905 g/cm³',
            tensileStrength: '34 MPa',
            meltingPoint: '162°C',
            moisture: '< 0.05%',
            origin: 'إنتاج الكينج بلاست / معتمد معملياً',
            applications: 'أدوات منزلية، كراسي، علب تغليف غذائي، أغطية',
          },
          mainImageUrl: IMG.ppStudio,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: true,
          isBestSeller: true,
          gallery: [IMG.ppStudio, IMG.warehousePallets, IMG.granulesMacro],
        },
        {
          sku: 'KP-HDPE-204',
          categoryId: catBySlug.get('hdpe') ?? null,
          nameAr: 'خرز بولي إيثيلين عالي الكثافة نفخ (HDPE Blow Molding)',
          nameEn: 'HDPE Blow Molding Extruded Pellets',
          descriptionAr:
            'حبيبات HDPE مخرزة ومفلترة بدقة فائقة لإنتاج الجراكن الصناعية وعبوات المنظفات والكيماويات، مقاومة عالية للتشقق الإجهادي.',
          descriptionEn:
            'Precision-filtered HDPE pellets ideal for jerrycans, detergent bottles, and chemical drums with high ESCR resistance.',
          materialType: 'HDPE',
          grade: 'Blow Molding Grade',
          color: 'أبيض / طبيعي / ألوان مخصصة',
          weight: '25 كجم / الشكارة',
          packaging: 'أكياس 25 كجم أو جامبو باج 1000 كجم',
          technicalSpecs: {
            mfi: '0.35 g/10 min (190°C / 2.16 kg)',
            density: '0.954 g/cm³',
            tensileStrength: '27 MPa',
            meltingPoint: '132°C',
            moisture: '< 0.08%',
            origin: 'خطوط تحبيب الكينج بلاست',
            applications: 'جراكن 5–20 لتر، عبوات كيماويات وزيوت، براميل',
          },
          mainImageUrl: IMG.hdpeStudio,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: true,
          isBestSeller: true,
          gallery: [IMG.hdpeStudio, IMG.extrusionLine, IMG.warehousePallets],
        },
        {
          sku: 'KP-PET-308',
          categoryId: catBySlug.get('pet') ?? null,
          nameAr: 'قشور PET مغسولة ساخنة فائقة النقاء (Hot-Washed Flakes)',
          nameEn: 'Crystal Clear Hot-Washed PET Flakes',
          descriptionAr:
            'رقائق PET مفروزة بالألوان ومغسولة كيميائياً على الساخن وخالية من PVC والأغطية، جاهزة لخطوط الشيت والألياف والأربطة.',
          descriptionEn:
            'Optically sorted, caustic hot-washed clear PET bottle flakes with ultra-low PVC contamination for sheet and fiber extrusion.',
          materialType: 'PET',
          grade: 'Hot-Washed Bottle Flakes (IV 0.76)',
          color: 'شفاف كريستال (Crystal Clear)',
          weight: '1000 كجم / جامبو باج',
          packaging: 'أكياس جامبو باج مزدوجة الحماية ضد الرطوبة',
          technicalSpecs: {
            mfi: 'IV 0.75 – 0.78 dL/g',
            density: '1.38 g/cm³',
            meltingPoint: '252°C',
            moisture: '< 0.4%',
            origin: 'وحدة الغسيل الساخن — الكينج بلاست',
            applications: 'ألواح التشكيل الحراري، ألياف البوليستر، شرائط التحزيم',
          },
          mainImageUrl: IMG.petStudio,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: true,
          isBestSeller: false,
          gallery: [IMG.petStudio, IMG.flakesSorting, IMG.warehousePallets],
        },
        {
          sku: 'KP-LDPE-402',
          categoryId: catBySlug.get('ldpe') ?? null,
          nameAr: 'حبيبات بولي إيثيلين منخفض الكثافة للأفلام (LDPE Film)',
          nameEn: 'LDPE Blown Film Grade Granules',
          descriptionAr:
            'خام LDPE مثالي لخطوط سحب الأكياس وأفلام الشرنك والتغليف الزراعي والصناعي، يمنح لمعاناً ومرونة ممتازة أثناء التشغيل.',
          descriptionEn:
            'LDPE film-grade resin delivering exceptional optical clarity, bubble stability, and heat-seal performance for packaging films.',
          materialType: 'LDPE',
          grade: 'Film Extrusion (MFI 0.8–2.0)',
          color: 'شفاف طبيعي / عسلي فاتح',
          weight: '25 كجم / الشكارة',
          packaging: 'أكياس مطبوعة 25 كجم على بالتات',
          technicalSpecs: {
            mfi: '1.8 g/10 min (190°C / 2.16 kg)',
            density: '0.922 g/cm³',
            tensileStrength: '14 MPa',
            meltingPoint: '110°C',
            moisture: '< 0.05%',
            origin: 'معامل التوريد المعتمدة',
            applications: 'أكياس تعبئة، رولات شرنك، أغطية صوبات زراعية',
          },
          mainImageUrl: IMG.granulesMacro,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: false,
          isBestSeller: true,
          gallery: [IMG.granulesMacro, IMG.ppStudio, IMG.extrusionLine],
        },
        {
          sku: 'KP-LLDPE-505',
          categoryId: catBySlug.get('lldpe') ?? null,
          nameAr: 'بولي إيثيلين خطي سترتش وروتو (LLDPE Butene/Hexene)',
          nameEn: 'LLDPE Stretch & Rotomolding Resin',
          descriptionAr:
            'خام LLDPE عالي المرونة ومقاوم للثقب مخصص لرولات السترتش الصناعية وخزانات المياه بتقنية التشكيل الدوراني.',
          descriptionEn:
            'High-elongation LLDPE formulated for puncture-resistant pallet stretch film and UV-stabilized rotational molding tanks.',
          materialType: 'LLDPE',
          grade: 'Stretch Film / Rotomolding',
          color: 'طبيعي (Natural)',
          weight: '25 كجم / الشكارة',
          packaging: 'أكياس 25 كجم محكمة الغلق',
          technicalSpecs: {
            mfi: '2.0 – 3.5 g/10 min',
            density: '0.918 – 0.935 g/cm³',
            tensileStrength: '22 MPa',
            meltingPoint: '122°C',
            moisture: '< 0.04%',
            origin: 'توريد صناعي مباشر',
            applications: 'سترتش تغليف بالتات، خزانات مياه، أفلام تغليف ثقيلة',
          },
          mainImageUrl: IMG.warehousePallets,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: false,
          isBestSeller: false,
          gallery: [IMG.warehousePallets, IMG.ppStudio],
        },
        {
          sku: 'KP-REC-601',
          categoryId: catBySlug.get('recycled-plastic-granules') ?? null,
          nameAr: 'خرز بلاستيك معاد تدويره مفلتر (Recycled PP/HDPE Pellets)',
          nameEn: 'Filtered Recycled PP & HDPE Granules',
          descriptionAr:
            'حبيبات بلاستيك معاد تدويره منتجة عبر مصفاة ليزر مزدوجة وشاشات ترشيح 120 ميكرون لضمان خلوها التام من الشوائب وثبات التدفق.',
          descriptionEn:
            'Double-degassed recycled polymer pellets processed through 120-micron filtration screens for consistent extrusion and molding.',
          materialType: 'Recycled',
          grade: '120-Micron Filtered Grade A',
          color: 'رمادي صناعي / أسود / ألوان موحدة',
          weight: '25 كجم / الشكارة',
          packaging: 'شكائر بولي بروبيلين 25 كجم / جامبو 1000 كجم',
          technicalSpecs: {
            mfi: '6 – 10 g/10 min',
            density: '0.91 – 0.95 g/cm³',
            moisture: '< 0.1%',
            origin: 'خطوط إنتاج الكينج بلاست — العاشر من رمضان',
            applications: 'مواسير الصرف، الصناديق الزراعية، البالتات البلاستيكية',
          },
          mainImageUrl: IMG.extrusionLine,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: true,
          isBestSeller: true,
          gallery: [IMG.extrusionLine, IMG.granulesMacro, IMG.heroRecycling],
        },
        {
          sku: 'KP-ABS-709',
          categoryId: catBySlug.get('abs') ?? null,
          nameAr: 'حبيبات ABS هندسية للحقن الدقيق (High-Impact ABS)',
          nameEn: 'High-Impact ABS Engineering Pellets',
          descriptionAr:
            'خام ABS بلمعان سطحي مرتفع ومقاومة فائقة للصدمات والحرارة، مثالي لهياكل الأجهزة الكهربائية ومكونات السيارات.',
          descriptionEn:
            'Glossy high-impact ABS copolymer ideal for consumer electronics housings, automotive trims, and precision enclosures.',
          materialType: 'ABS',
          grade: 'High Gloss Injection Grade',
          color: 'أبيض ناصع / طبيعي',
          weight: '25 كجم / الشكارة',
          packaging: 'أكياس ورقية/بوليمر متعددة الطبقات 25 كجم',
          technicalSpecs: {
            mfi: '20 g/10 min (220°C / 10 kg)',
            density: '1.04 g/cm³',
            tensileStrength: '45 MPa',
            meltingPoint: '220–245°C',
            moisture: '< 0.1% (يُنصح بالتجفيف المسبق)',
            origin: 'مخازن الكينج بلاست للبوليمرات الهندسية',
            applications: 'أجهزة منزلية، إلكترونيات، قطع غيار سيارات، تكييفات',
          },
          mainImageUrl: IMG.petStudio,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: false,
          isBestSeller: false,
          gallery: [IMG.petStudio, IMG.ppStudio],
        },
        {
          sku: 'KP-PVC-803',
          categoryId: catBySlug.get('pvc') ?? null,
          nameAr: 'كومباوند وراتنج PVC للمواسير والكابلات (PVC Resin K67)',
          nameEn: 'PVC Suspension Resin K67 & Compounds',
          descriptionAr:
            'خام PVC ذو ثبات حراري ممتاز ومناسب لبثق المواسير عالية الضغط والوصلات وعزل الكابلات الكهربائية.',
          descriptionEn:
            'Suspension PVC resin (K-value 67) offering uniform particle distribution for pressure pipes, fittings, and cable insulation.',
          materialType: 'PVC',
          grade: 'K-Value 67 Suspension',
          color: 'أبيض ناصع',
          weight: '25 كجم / الشكارة',
          packaging: 'أكياس 25 كجم مبطنة',
          technicalSpecs: {
            density: '1.40 g/cm³',
            tensileStrength: '50 MPa',
            moisture: '< 0.3%',
            origin: 'توريد معتمد لخطوط البثق',
            applications: 'مواسير المياه والصرف، بروفيلات UPVC، كابلات',
          },
          mainImageUrl: IMG.warehousePallets,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: false,
          isBestSeller: false,
          gallery: [IMG.warehousePallets, IMG.extrusionLine],
        },
        {
          sku: 'KP-SCRAP-902',
          categoryId: catBySlug.get('plastic-scrap') ?? null,
          nameAr: 'مجروش بلاستيك HDPE/PP مفروز ومغسول (Sorted Regrind)',
          nameEn: 'Washed & Sorted HDPE/PP Plastic Regrind',
          descriptionAr:
            'كسر بلاستيك نظيف من هالك المصانع (صناديق وجراكن) مفروز بدقة ومغسول ومجفف حرارياً وجاهز لإعادة الحقن أو التحبيب.',
          descriptionEn:
            'Clean post-industrial HDPE and PP regrind from crates and drums, washed, thermally dried, and ready for compounding.',
          materialType: 'Scrap',
          grade: 'Washed Regrind 8–12mm',
          color: 'ألوان مفروزة (أزرق / أبيض / مختلط نظيف)',
          weight: '1000 كجم / جامبو باج',
          packaging: 'جامبو باج أو بالات مضغوطة',
          technicalSpecs: {
            density: '0.94 – 0.96 g/cm³',
            moisture: '< 0.5%',
            origin: 'مركز الفرز والغسيل — الكينج بلاست',
            applications: 'خطوط التحبيب، تصنيع الصناديق والمواسير، البالتات',
          },
          mainImageUrl: IMG.flakesSorting,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: true,
          isBestSeller: false,
          gallery: [IMG.flakesSorting, IMG.heroRecycling],
        },
        {
          sku: 'KP-PE-110',
          categoryId: catBySlug.get('polyethylene-pe') ?? null,
          nameAr: 'بولي إيثيلين مواسير أسود PE100 (Black Pipe Compound)',
          nameEn: 'PE100 Black Pipe Grade Compound',
          descriptionAr:
            'خام بولي إيثيلين عالي الأداء مضاف إليه كربون بلاك لحماية خطوط المياه والغاز من الأشعة فوق البنفسجية وضغوط الشبكات.',
          descriptionEn:
            'Carbon-black stabilized PE100 bimodal compound engineered for high-pressure water and gas distribution pipelines.',
          materialType: 'PE',
          grade: 'PE100 Bimodal',
          color: 'أسود لامع (Carbon Black 2.25%)',
          weight: '25 كجم / الشكارة',
          packaging: 'شكائر 25 كجم مقاومة للأشعة فوق البنفسجية',
          technicalSpecs: {
            mfi: '0.25 g/10 min (190°C / 5 kg)',
            density: '0.959 g/cm³',
            tensileStrength: '25 MPa',
            meltingPoint: '131°C',
            origin: 'توريد شركات البنية التحتية',
            applications: 'مواسير المياه الرئيسية، شبكات الري، خطوط الغاز',
          },
          mainImageUrl: IMG.granulesMacro,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: false,
          isBestSeller: false,
          gallery: [IMG.granulesMacro, IMG.hdpeStudio],
        },
        {
          sku: 'KP-RAW-115',
          categoryId: catBySlug.get('plastic-raw-materials') ?? null,
          nameAr: 'بولي بروبيلين رافيا للسجاد والأنسجة (PP Raffia Grade)',
          nameEn: 'PP Raffia Yarn & Woven Sack Grade',
          descriptionAr:
            'حبيبات بولي بروبيلين متخصصة لخطوط تصنيع الشكائر المنسوجة والأنسجة الصناعية بقوة شد واستطالة متوازنة.',
          descriptionEn:
            'Polypropylene raffia grade tailored for high-speed tape extrusion, woven PP sacks, and FIBC jumbo bags.',
          materialType: 'PP',
          grade: 'Raffia T30S (MFI 3.2)',
          color: 'طبيعي ناصع',
          weight: '25 كجم / الشكارة',
          packaging: 'شكائر 25 كجم على بالتات 1.375 طن',
          technicalSpecs: {
            mfi: '3.2 g/10 min (230°C / 2.16 kg)',
            density: '0.905 g/cm³',
            tensileStrength: '35 MPa',
            meltingPoint: '164°C',
            origin: 'خام أولي معتمد',
            applications: 'الشكائر المنسوجة، جامبو باج، الحبال الصناعية',
          },
          mainImageUrl: IMG.ppStudio,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: false,
          isBestSeller: false,
          gallery: [IMG.ppStudio, IMG.warehousePallets],
        },
        {
          sku: 'KP-IND-120',
          categoryId: catBySlug.get('other-plastic-materials') ?? null,
          nameAr: 'ماستر باتش أبيض وأسود وكالسيوم فيلر (CaCO3 & Masterbatch)',
          nameEn: 'White/Black Masterbatch & Calcium Filler',
          descriptionAr:
            'إضافات تركيز لوني عالية التغطية وفيلر كربونات كالسيوم نانوي لتحسين الصلابة وتقليل التكلفة التشغيلية لخطوط السحب والحقن.',
          descriptionEn:
            'High-dispersion TiO2 white/carbon black masterbatch and CaCO3 filler compounds for film, sheet, and injection lines.',
          materialType: 'Other',
          grade: '70% TiO2 / 80% CaCO3',
          color: 'أبيض ثلجي / أسود مركز',
          weight: '25 كجم / الشكارة',
          packaging: 'شكائر 25 كجم مانعة للرطوبة',
          technicalSpecs: {
            mfi: '15 – 25 g/10 min',
            density: '1.65 g/cm³',
            moisture: '< 0.1%',
            origin: 'معمل التركيبات — الكينج بلاست',
            applications: 'تحسين عتامة الأفلام، رفع صلابة الشكائر والأدوات',
          },
          mainImageUrl: IMG.hdpeStudio,
          availableQuantity: null,
          minOrderQuantity: 1,
          price: null,
          discountPrice: null,
          priceUnit: 'contact',
          currency: 'EGP',
          availabilityStatus: 'upon_request',
          isPublished: true,
          isFeatured: false,
          isBestSeller: false,
          gallery: [IMG.hdpeStudio, IMG.ppStudio],
        },
      ];

      for (const item of productSeed) {
        const { gallery, ...productValues } = item;
        const [inserted] = await db
          .insert(products)
          .values(productValues)
          .onConflictDoNothing()
          .returning();
        if (inserted && gallery.length > 0) {
          await db.insert(productImages).values(
            gallery.map((url, idx) => ({
              productId: inserted.id,
              imageUrl: url,
              altText: inserted.nameEn,
              sortOrder: idx,
            }))
          );
        }
      }
    }
  }

  // 4. Seed Banners
  const existingBanners = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM banners`);
  if (Number((existingBanners.rows[0] as { cnt: number })?.cnt ?? 0) === 0) {
    await db.insert(banners).values([
      {
        titleAr: 'من إعادة التدوير إلى خامات تصنع المستقبل',
        titleEn: 'From Recycling to Raw Materials Shaping the Future',
        subtitleAr:
          'خامات بلاستيك صناعية فائقة النقاء — توريد منتظم، اختبارات MFI مخبرية، وشحن مباشر للمصانع.',
        subtitleEn:
          'High-purity recycled granules and virgin polymers — consistent MFI testing and factory-direct logistics.',
        ctaTextAr: 'تصفح سوق الخامات',
        ctaTextEn: 'Browse Marketplace',
        ctaLink: '#marketplace',
        imageUrl: IMG.heroRecycling,
        badgeTextAr: 'توريد مصانع وتصدير',
        badgeTextEn: 'B2B Factory Direct',
        isActive: true,
        sortOrder: 1,
      },
      {
        titleAr: 'خطوط تحبيب وفلترة 120 ميكرون لثبات جودة الإنتاج',
        titleEn: '120-Micron Filtration Extrusion Lines',
        subtitleAr:
          'إنتاج حبيبات PP و HDPE و LDPE بدرجات انسياب مضبوطة تناسب أسرع ماكينات الحقن والنفخ.',
        subtitleEn:
          'Precision-degassed PP, HDPE, and LDPE pellets engineered for high-speed injection and blow molding.',
        ctaTextAr: 'اطلب عرض سعر فوري',
        ctaTextEn: 'Request Quotation',
        ctaLink: '#support',
        imageUrl: IMG.extrusionLine,
        badgeTextAr: 'ضمان المواصفات الفنية',
        badgeTextEn: 'Lab-Tested MFI',
        isActive: true,
        sortOrder: 2,
      },
      {
        titleAr: 'مخازن ولوجستيات توريد جاهزة للشحن بالطن والحاوية',
        titleEn: 'Ready-to-Dispatch Palletized Warehousing',
        subtitleAr:
          'تغليف قياسي 25 كجم وأكياس جامبو باج 1000 كجم جاهزة للتسليم الفوري لجميع المناطق الصناعية.',
        subtitleEn:
          'Standard 25kg woven sacks and 1000kg jumbo bags prepared for rapid delivery to all industrial cities.',
        ctaTextAr: 'شاهد المخزون المتاح',
        ctaTextEn: 'Explore Categories',
        ctaLink: '#categories',
        imageUrl: IMG.warehousePallets,
        badgeTextAr: 'تغطية شاملة',
        badgeTextEn: 'Nationwide Logistics',
        isActive: true,
        sortOrder: 3,
      },
    ]);
  }

  // 5. Seed Dynamic CMS Sections
  const existingSections = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM website_sections`);
  if (Number((existingSections.rows[0] as { cnt: number })?.cnt ?? 0) === 0) {
    await db
      .insert(websiteSections)
      .values([
        {
          sectionKey: 'quality_lab',
          titleAr: 'اختبارات الجودة ومعمل البوليمرات',
          titleEn: 'Polymer Quality Control Laboratory',
          subtitleAr: 'فحص دقيق لكل تشغيلة قبل الشحن',
          subtitleEn: 'Batch-verified technical certificates before dispatch',
          contentAr:
            'تخضع كل دفعة من حبيبات الكينج بلاست لاختبارات معامل الانسياب (MFI) والكثافة ونسبة الرطوبة والرماد لضمان استقرار الماكينات وتقليل الهالك في خطوط إنتاج عملائنا.',
          contentEn:
            'Every production batch undergoes Melt Flow Index (MFI), density, moisture, and ash-content validation to guarantee uninterrupted machine performance.',
          imageUrl: IMG.petStudio,
          isVisible: true,
          sortOrder: 1,
        },
        {
          sectionKey: 'supply_chain',
          titleAr: 'سلاسل الإمداد والتوريد المستمر للمصانع',
          titleEn: 'Continuous Industrial Supply Chain',
          subtitleAr: 'تعاقدات شهرية وأسعار جملة مخصصة',
          subtitleEn: 'Monthly supply contracts and custom bulk pricing',
          contentAr:
            'نوفر عقود توريد مرنة بالطن والكونتينر لمصانع التعبئة، المواسير، الأدوات المنزلية، والأفلام، مع خدمة استشارات فنية لاختيار الدرجة المثالية لخطك الإنتاجي.',
          contentEn:
            'Flexible tonnage and container supply contracts for packaging, piping, film, and household manufacturing plants with dedicated polymer engineering support.',
          imageUrl: IMG.warehousePallets,
          isVisible: true,
          sortOrder: 2,
        },
      ])
      .onConflictDoNothing();
  }

  // 6. Seed Default Laila AI Assistant Settings
  const existingAi = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM ai_settings`);
  if (Number((existingAi.rows[0] as { cnt: number })?.cnt ?? 0) === 0) {
    await db
      .insert(aiSettings)
      .values({
        key: 'default',
        aiEnabled: true,
        assistantNameAr: 'ليلي',
        assistantNameEn: 'Laila',
        avatarUrl: '/src/assets/images/laila_ai_avatar_1794909558706.jpg',
      })
      .onConflictDoNothing();
  }
}
