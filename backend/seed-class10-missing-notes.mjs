import "dotenv/config";
import mongoose from "mongoose";
import Note from "./src/models/Note.js";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing from backend/.env");
}

const CLASS_NUMBER = 10;

const notes = [
  {
    subject: "English",
    chapter: "A Letter to God",
    content: `A Letter to God — Class 10 English

A Letter to God is a story about Lencho, a poor farmer whose crop is destroyed by a hailstorm. Lencho has complete faith in God and writes a letter asking God for money to recover from the loss.

Key points:
• Lencho is a hardworking farmer.
• A hailstorm destroys his crop.
• He expects help from God.
• The postmaster and employees collect money for Lencho.
• Lencho receives only seventy pesos.
• He believes the post office employees have stolen the remaining money.
• The story highlights faith, innocence, irony and human kindness.`,
    tags: ["NCERT", "Class 10", "English", "A Letter to God"]
  },

  {
    subject: "English",
    chapter: "Nelson Mandela – Long Walk to Freedom",
    content: `Nelson Mandela – Long Walk to Freedom — Class 10 English

The chapter is an extract from Nelson Mandela's autobiography describing the inauguration of a democratic government in South Africa.

Key points:
• Mandela became the first black President of democratic South Africa.
• The ceremony represented the end of apartheid.
• Mandela remembers the sacrifices of freedom fighters.
• He explains that courage is not the absence of fear.
• Apartheid deprived black people of basic rights.
• Mandela believes both the oppressed and the oppressor need freedom.
• The chapter emphasises freedom, equality, courage and reconciliation.`,
    tags: ["NCERT", "Class 10", "English", "Nelson Mandela"]
  },

  {
    subject: "English",
    chapter: "Two Stories about Flying",
    content: `Two Stories about Flying — Class 10 English

The chapter contains two stories: His First Flight and The Black Aeroplane.

His First Flight:
• A young seagull is afraid to fly.
• His family encourages him to overcome his fear.
• Hunger finally motivates him to fly.
• He discovers that he can fly successfully.

The Black Aeroplane:
• A pilot flying toward England encounters storm clouds.
• His instruments stop working.
• A mysterious black aeroplane appears and guides him.
• After landing, the pilot learns that no other aeroplane was visible on radar.
• The story creates mystery and suspense.`,
    tags: ["NCERT", "Class 10", "English", "Two Stories about Flying"]
  },

  {
    subject: "English",
    chapter: "From the Diary of Anne Frank",
    content: `From the Diary of Anne Frank — Class 10 English

Anne Frank records her thoughts and experiences in her diary during the Second World War.

Key points:
• Anne considers her diary a close friend.
• She names her diary Kitty.
• She discusses school, teachers and classmates.
• Anne feels that she cannot easily share her inner thoughts with others.
• She writes honestly about her feelings and experiences.
• The chapter shows the importance of self-expression, friendship and reflection.`,
    tags: ["NCERT", "Class 10", "English", "Anne Frank"]
  },

  {
    subject: "Science",
    chapter: "Acids, Bases and Salts",
    content: `Acids, Bases and Salts — Class 10 Science

Acids produce hydrogen ions in aqueous solution, while bases produce hydroxide ions.

Key points:
• Acids turn blue litmus red.
• Bases turn red litmus blue.
• The pH scale measures how acidic or basic a solution is.
• pH values below 7 indicate acidic solutions.
• pH 7 represents a neutral solution.
• pH values above 7 indicate basic solutions.
• Acids react with metals to produce salt and hydrogen gas.
• Acids react with bases in neutralisation reactions.
• Common salts include sodium chloride, baking soda, washing soda and bleaching powder.`,
    tags: ["NCERT", "Class 10", "Science", "Acids", "Bases", "Salts"]
  },

  {
    subject: "Science",
    chapter: "Metals and Non-metals",
    content: `Metals and Non-metals — Class 10 Science

Metals and non-metals have different physical and chemical properties.

Metals:
• Generally lustrous and hard.
• Good conductors of heat and electricity.
• Usually malleable and ductile.
• Form positive ions by losing electrons.

Non-metals:
• Generally poor conductors.
• Usually brittle in solid form.
• Tend to gain or share electrons.

Important concepts include reactivity series, ionic compounds, extraction of metals, corrosion and prevention of corrosion.`,
    tags: ["NCERT", "Class 10", "Science", "Metals", "Non-metals"]
  },

  {
    subject: "Science",
    chapter: "Carbon and Its Compounds",
    content: `Carbon and Its Compounds — Class 10 Science

Carbon forms a large number of compounds because of its tetravalency and catenation.

Key points:
• Carbon has valency four.
• Carbon can form single, double and triple covalent bonds.
• Hydrocarbons contain carbon and hydrogen.
• Saturated hydrocarbons contain single bonds.
• Unsaturated hydrocarbons contain double or triple bonds.
• Homologous series contains compounds with similar chemical properties.
• Ethanol and ethanoic acid are important carbon compounds.
• Soaps and detergents are used for cleansing.`,
    tags: ["NCERT", "Class 10", "Science", "Carbon"]
  },

  {
    subject: "Science",
    chapter: "Life Processes",
    content: `Life Processes — Class 10 Science

Life processes are the basic functions required to maintain life.

Major life processes:
• Nutrition
• Respiration
• Transportation
• Excretion

Plants prepare food through photosynthesis. Human beings obtain nutrition through the digestive system. Respiration releases energy from food. The circulatory system transports materials throughout the body. The kidneys remove nitrogenous wastes through urine.`,
    tags: ["NCERT", "Class 10", "Science", "Life Processes"]
  },

  {
    subject: "Science",
    chapter: "Control and Coordination",
    content: `Control and Coordination — Class 10 Science

Control and coordination allow organisms to respond to changes in their environment.

Key points:
• The nervous system coordinates responses in animals.
• Neurons are the structural and functional units of the nervous system.
• Reflex actions provide quick responses.
• The brain and spinal cord form the central nervous system.
• Hormones coordinate many functions in animals.
• Plants coordinate responses using hormones and growth movements.
• Auxin, gibberellin, cytokinin, abscisic acid and ethylene are important plant hormones.`,
    tags: ["NCERT", "Class 10", "Science", "Control", "Coordination"]
  },

  {
    subject: "Science",
    chapter: "How Do Organisms Reproduce?",
    content: `How Do Organisms Reproduce? — Class 10 Science

Reproduction produces new individuals of the same species.

Key points:
• Asexual reproduction involves a single parent.
• Binary fission, budding, fragmentation and spore formation are examples.
• Sexual reproduction involves formation and fusion of gametes.
• In flowering plants, reproduction involves flowers, pollen and ovules.
• Human reproduction involves male and female reproductive systems.
• Fertilisation forms a zygote.
• Reproductive health includes awareness, hygiene and responsible choices.`,
    tags: ["NCERT", "Class 10", "Science", "Reproduction"]
  },

  {
    subject: "Science",
    chapter: "Heredity",
    content: `Heredity — Class 10 Science

Heredity is the transmission of characteristics from parents to offspring.

Key points:
• Genes control inherited characteristics.
• Mendel studied inheritance using pea plants.
• Dominant traits can mask recessive traits.
• Genetic information is carried by DNA.
• Chromosomes contain genes.
• Sex determination in humans involves X and Y chromosomes.
• Variations arise through changes and recombination of genetic material.`,
    tags: ["NCERT", "Class 10", "Science", "Heredity", "Genetics"]
  },

  {
    subject: "Science",
    chapter: "Electricity",
    content: `Electricity — Class 10 Science

Electric current is the rate of flow of electric charge.

Important formulas:
I = Q/t
V = IR
P = VI
P = I²R
P = V²/R

Key points:
• SI unit of current is ampere.
• SI unit of potential difference is volt.
• Resistance opposes the flow of current.
• Ohm's law relates voltage, current and resistance.
• Resistors can be connected in series or parallel.
• Electrical energy can be converted into heat and other forms of energy.`,
    tags: ["NCERT", "Class 10", "Science", "Electricity", "Ohm's Law"]
  },

  {
    subject: "Science",
    chapter: "Magnetic Effects of Electric Current",
    content: `Magnetic Effects of Electric Current — Class 10 Science

An electric current produces a magnetic field around a conductor.

Key points:
• Magnetic field lines represent the magnetic field.
• The right-hand thumb rule determines the direction of the magnetic field around a straight conductor.
• A current-carrying coil produces a magnetic field.
• An electromagnet is produced using current through a coil.
• Electric motors convert electrical energy into mechanical energy.
• Electromagnetic induction produces current due to changing magnetic fields.
• Generators convert mechanical energy into electrical energy.`,
    tags: ["NCERT", "Class 10", "Science", "Magnetism"]
  },

  {
    subject: "Social Science",
    chapter: "The Rise of Nationalism in Europe",
    content: `The Rise of Nationalism in Europe — Class 10 Social Science

Nationalism developed strongly in Europe during the nineteenth century.

Key points:
• The French Revolution promoted ideas of liberty, equality and fraternity.
• Napoleon introduced administrative and legal reforms.
• The Congress of Vienna attempted to restore conservative order.
• Giuseppe Mazzini promoted the idea of a united Italy.
• Germany was unified under Prussian leadership.
• Nationalism also developed in other European regions.
• The growth of nationalism changed the political map of Europe.`,
    tags: ["NCERT", "Class 10", "Social Science", "History", "Nationalism"]
  },

  {
    subject: "Social Science",
    chapter: "Nationalism in India",
    content: `Nationalism in India — Class 10 Social Science

Indian nationalism developed through resistance to colonial rule and mass movements.

Key points:
• The First World War created economic and political difficulties.
• Mahatma Gandhi introduced satyagraha as a method of non-violent resistance.
• The Non-Cooperation Movement encouraged people to withdraw cooperation from colonial institutions.
• The Civil Disobedience Movement challenged colonial laws.
• Different social groups participated in the national movement in different ways.
• Symbols, folklore and history helped create a sense of collective identity.`,
    tags: ["NCERT", "Class 10", "Social Science", "History", "Nationalism in India"]
  },

  {
    subject: "Social Science",
    chapter: "The Making of a Global World",
    content: `The Making of a Global World — Class 10 Social Science

Globalisation has historical roots in trade, migration, technology and economic exchange.

Key points:
• Pre-modern trade connected distant regions.
• Food, goods, people and ideas travelled across continents.
• The nineteenth century saw increased international trade and migration.
• Colonialism shaped global economic relationships.
• Indentured labour was an important form of labour migration.
• The Great Depression affected economies around the world.
• Global economic connections continued to change during the twentieth century.`,
    tags: ["NCERT", "Class 10", "Social Science", "History", "Global World"]
  },

  {
    subject: "Social Science",
    chapter: "The Age of Industrialisation",
    content: `The Age of Industrialisation — Class 10 Social Science

Industrialisation transformed production, labour and markets.

Key points:
• Before factories became dominant, many goods were produced through proto-industrial systems.
• The Industrial Revolution changed methods of production.
• Factories expanded in Britain and later in other regions.
• Industrialisation affected workers and working conditions.
• Indian textile production faced competition from British manufactured goods.
• Industrial growth in India developed in several phases.
• Advertisements and branding influenced consumer demand.`,
    tags: ["NCERT", "Class 10", "Social Science", "History", "Industrialisation"]
  },

  {
    subject: "Social Science",
    chapter: "Print Culture and the Modern World",
    content: `Print Culture and the Modern World — Class 10 Social Science

Printing transformed the circulation of knowledge and ideas.

Key points:
• Early printing developed in East Asia.
• Gutenberg developed a printing press in Europe.
• Printed books became more widely available.
• Print encouraged debate and discussion.
• Religious and political ideas circulated through printed material.
• Print culture contributed to social and cultural change.
• In India, newspapers, journals and books became important forms of public communication.`,
    tags: ["NCERT", "Class 10", "Social Science", "History", "Print Culture"]
  },

  {
    subject: "Social Science",
    chapter: "Resources and Development",
    content: `Resources and Development — Class 10 Social Science

Resources are materials, objects and features that have utility and value.

Key points:
• Resources can be classified based on origin, exhaustibility, ownership and status of development.
• Sustainable development aims to use resources responsibly.
• Resource planning is important for balanced development.
• Land is an important natural resource.
• Land degradation can result from deforestation, overgrazing, mining and improper farming practices.
• Soil conservation helps maintain agricultural productivity.`,
    tags: ["NCERT", "Class 10", "Social Science", "Geography", "Resources"]
  },

  {
    subject: "Social Science",
    chapter: "Forest and Wildlife Resources",
    content: `Forest and Wildlife Resources — Class 10 Social Science

Forests and wildlife are important components of biodiversity.

Key points:
• Biodiversity includes the variety of living organisms.
• Habitat destruction is a major threat to wildlife.
• Species may be classified according to their conservation status.
• Conservation protects ecosystems and biological diversity.
• Protected areas include national parks, wildlife sanctuaries and biosphere reserves.
• Local communities can play an important role in conservation.`,
    tags: ["NCERT", "Class 10", "Social Science", "Geography", "Wildlife"]
  },

  {
    subject: "Social Science",
    chapter: "Water Resources",
    content: `Water Resources — Class 10 Social Science

Water is an essential renewable resource, but its availability is uneven.

Key points:
• Water is used for domestic, agricultural and industrial purposes.
• Multipurpose river valley projects provide irrigation, electricity and other benefits.
• Large dams can also create social and environmental problems.
• Rainwater harvesting helps conserve water.
• Sustainable management is necessary because freshwater resources are limited.`,
    tags: ["NCERT", "Class 10", "Social Science", "Geography", "Water Resources"]
  },

  {
    subject: "Social Science",
    chapter: "Agriculture",
    content: `Agriculture — Class 10 Social Science

Agriculture is an important economic activity and provides employment and raw materials.

Key points:
• Farming systems vary according to physical and socio-economic conditions.
• Major types include primitive subsistence farming, intensive subsistence farming and commercial farming.
• Rice, wheat, millets, pulses, sugarcane, tea, coffee, cotton and jute are important crops.
• Irrigation supports agricultural production.
• Technological changes have influenced Indian agriculture.
• Institutional reforms and sustainable farming are important for long-term development.`,
    tags: ["NCERT", "Class 10", "Social Science", "Geography", "Agriculture"]
  },

  {
    subject: "Social Science",
    chapter: "Minerals and Energy Resources",
    content: `Minerals and Energy Resources — Class 10 Social Science

Minerals are naturally occurring substances with definite chemical and physical properties.

Key points:
• Minerals can be metallic or non-metallic.
• Iron ore is an important metallic mineral.
• Coal and petroleum are major conventional energy resources.
• Natural gas is also an important source of energy.
• Renewable resources include solar, wind, tidal and biogas energy.
• Conservation is necessary because many mineral and energy resources are exhaustible.`,
    tags: ["NCERT", "Class 10", "Social Science", "Geography", "Minerals"]
  },

  {
    subject: "Social Science",
    chapter: "Manufacturing Industries",
    content: `Manufacturing Industries — Class 10 Social Science

Manufacturing transforms raw materials into finished products.

Key points:
• Manufacturing contributes to economic development.
• Industries provide employment and support trade.
• Important industries include textiles, iron and steel, chemicals, cement and automobiles.
• Industrial location depends on raw materials, labour, power, capital, transport and markets.
• Industrial pollution can affect air, water and land.
• Cleaner technologies and pollution-control measures help reduce environmental damage.`,
    tags: ["NCERT", "Class 10", "Social Science", "Geography", "Manufacturing"]
  },

  {
    subject: "Social Science",
    chapter: "Lifelines of National Economy",
    content: `Lifelines of National Economy — Class 10 Social Science

Transport and communication connect producers, consumers and markets.

Key points:
• Roads and railways are important land transport systems.
• Pipelines transport petroleum, natural gas and other products.
• Waterways provide an economical means of transporting bulky goods.
• Airways provide rapid transportation over long distances.
• Communication networks support economic and social activities.
• International trade connects India with the global economy.
• Tourism contributes to employment and economic activity.`,
    tags: ["NCERT", "Class 10", "Social Science", "Geography", "Transport"]
  },

  {
    subject: "Social Science",
    chapter: "Power Sharing",
    content: `Power Sharing — Class 10 Social Science

Power sharing is an important principle of democratic government.

Key points:
• Power sharing reduces the possibility of conflict between social groups.
• It is desirable because it helps maintain political stability.
• Belgium adopted accommodation among different linguistic communities.
• Sri Lanka followed majoritarian policies that created conflict.
• Power may be shared among different organs of government, levels of government, social groups and political parties.`,
    tags: ["NCERT", "Class 10", "Social Science", "Political Science", "Power Sharing"]
  },

  {
    subject: "Social Science",
    chapter: "Federalism",
    content: `Federalism — Class 10 Social Science

Federalism is a system in which power is divided between different levels of government.

Key points:
• There are generally two or more levels of government.
• Constitutional division of powers protects each level.
• Independent courts help resolve disputes.
• India has Union, State and local levels of government.
• The Constitution divides subjects into Union, State and Concurrent Lists.
• Decentralisation strengthens local government.`,
    tags: ["NCERT", "Class 10", "Social Science", "Political Science", "Federalism"]
  },

  {
    subject: "Social Science",
    chapter: "Gender, Religion and Caste",
    content: `Gender, Religion and Caste — Class 10 Social Science

Social differences influence political life in different ways.

Key points:
• Gender division often creates unequal opportunities for women.
• Political representation can help address gender inequality.
• Religion can become a political issue when communalism develops.
• Caste inequalities have social and economic consequences.
• Democracy should provide equal political and social rights.
• Political expression of social differences can be constructive when it promotes equality.`,
    tags: ["NCERT", "Class 10", "Social Science", "Political Science", "Gender", "Religion", "Caste"]
  },

  {
    subject: "Social Science",
    chapter: "Political Parties",
    content: `Political Parties — Class 10 Social Science

Political parties are organised groups that seek to influence government and exercise political power.

Key points:
• Political parties contest elections.
• They formulate policies and programmes.
• They form governments and perform opposition functions.
• Parties connect citizens with government.
• Major challenges include lack of internal democracy, dynastic succession, money and muscle power and limited meaningful choices.
• Reforms can strengthen political parties and democratic participation.`,
    tags: ["NCERT", "Class 10", "Social Science", "Political Science", "Political Parties"]
  },

  {
    subject: "Social Science",
    chapter: "Outcomes of Democracy",
    content: `Outcomes of Democracy — Class 10 Social Science

Democracy is evaluated through its outcomes in governance and society.

Key points:
• Democratic governments are accountable and responsive.
• Democracy improves the quality of decision-making through consultation.
• Democracy provides mechanisms for resolving differences.
• It promotes dignity and freedom of citizens.
• Economic inequality may continue even under democratic systems.
• Democracy is expected to accommodate social diversity.`,
    tags: ["NCERT", "Class 10", "Social Science", "Political Science", "Democracy"]
  },

  {
    subject: "Social Science",
    chapter: "Challenges to Democracy",
    content: `Challenges to Democracy — Class 10 Social Science

Democracies face challenges that require continuous improvement.

Three broad challenges:
• Foundational challenge: establishing democratic institutions and practices.
• Challenge of expansion: extending democratic principles to all regions and social groups.
• Deepening of democracy: strengthening institutions and participation.

Democratic reforms should improve citizen participation, accountability, representation and institutional effectiveness.`,
    tags: ["NCERT", "Class 10", "Social Science", "Political Science", "Democracy"]
  },

  {
    subject: "Social Science",
    chapter: "Development",
    content: `Development — Class 10 Social Science

Development means improvement in people's lives, but different people may have different development goals.

Key points:
• Income is an important measure but is not the only measure of development.
• People also value security, equality, freedom, health and education.
• Per capita income is used to compare average income.
• Public facilities influence quality of life.
• Sustainable development considers the needs of future generations.
• Human development includes multiple dimensions of well-being.`,
    tags: ["NCERT", "Class 10", "Social Science", "Economics", "Development"]
  },

  {
    subject: "Social Science",
    chapter: "Sectors of the Indian Economy",
    content: `Sectors of the Indian Economy — Class 10 Social Science

Economic activities can be classified into different sectors.

Key points:
• Primary sector uses natural resources directly.
• Secondary sector converts raw materials into finished goods.
• Tertiary sector provides services.
• Organised and unorganised sectors differ in regulation and worker protection.
• Public and private sectors differ according to ownership.
• Disguised unemployment is an important issue in the agricultural sector.
• Employment generation and social security are important development concerns.`,
    tags: ["NCERT", "Class 10", "Social Science", "Economics", "Sectors"]
  },

  {
    subject: "Social Science",
    chapter: "Money and Credit",
    content: `Money and Credit — Class 10 Social Science

Money facilitates exchange and provides a common measure of value.

Key points:
• Modern money includes currency and bank deposits.
• Banks accept deposits and provide loans.
• Credit can support production and investment.
• Terms of credit include interest rate, collateral, documentation and mode of repayment.
• Formal sources include banks and cooperatives.
• Informal lenders may charge higher interest rates.
• Self-help groups can provide credit and support financial inclusion.`,
    tags: ["NCERT", "Class 10", "Social Science", "Economics", "Money", "Credit"]
  },

  {
    subject: "Social Science",
    chapter: "Globalisation and the Indian Economy",
    content: `Globalisation and the Indian Economy — Class 10 Social Science

Globalisation refers to increasing integration of production and markets across countries.

Key points:
• Multinational corporations operate and invest across countries.
• Production may be organised through global networks.
• Liberalisation reduced several restrictions on foreign trade and investment in India.
• Globalisation creates opportunities and competition.
• Its effects differ among producers, workers and consumers.
• International institutions influence global economic relations.`,
    tags: ["NCERT", "Class 10", "Social Science", "Economics", "Globalisation"]
  },

  {
    subject: "Social Science",
    chapter: "Consumer Rights",
    content: `Consumer Rights — Class 10 Social Science

Consumers need protection against unfair trade practices and defective products.

Key points:
• Consumers have rights such as safety, information, choice and redressal.
• Standardisation marks help consumers identify quality standards.
• Bills and receipts provide evidence of purchase.
• Consumer awareness helps people make informed choices.
• Consumer protection laws provide mechanisms for seeking redressal.
• Responsible consumption also requires awareness of product information and quality.`,
    tags: ["NCERT", "Class 10", "Social Science", "Economics", "Consumer Rights"]
  }
];

try {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  let created = 0;
  let skipped = 0;

  for (const item of notes) {
    const existing = await Note.findOne({
      userId: null,
      subject: item.subject,
      chapter: item.chapter,
      class: CLASS_NUMBER,
      source: "seed"
    });

    if (existing) {
      skipped++;
      console.log(`SKIPPED ${item.subject} | ${item.chapter}`);
      continue;
    }

    await Note.create({
      userId: null,
      subject: item.subject,
      chapter: item.chapter,
      class: CLASS_NUMBER,
      board: "NCERT",
      content: item.content.trim(),
      source: "seed",
      tags: item.tags
    });

    created++;
    console.log(`CREATED ${item.subject} | ${item.chapter}`);
  }

  console.log("");
  console.log("==============================================");
  console.log("CLASS 10 MISSING NOTES SEED COMPLETE");
  console.log("==============================================");
  console.log(`Created: ${created}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Total seed notes in script: ${notes.length}`);

} catch (error) {
  console.error("SEED FAILED:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
}
