#!/usr/bin/env node
/**
 * Issue #28: expand catalog to 300 paintings (+100 western canonical works).
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonsUrl, validateImageUrl } from './commons-url.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');

function p(id, filename, title, year, description, width, height) {
  return {
    id,
    url: filename.startsWith('http') ? filename : commonsUrl(decodeURIComponent(filename)),
    title,
    year,
    description,
    dimensions: { width, height },
  };
}

const NEW_AUTHORS = {
  'paul-gauguin': {
    meta: {
      id: 'paul-gauguin',
      name: 'Paul Gauguin',
      category: 'impresionismo-postimpresionismo',
      fullName: 'Eugène Henri Paul Gauguin',
      years: '1848 – 1903',
      origin: 'París, Francia',
      bio: 'Broker parisino convertido en pintor postimpresionista que buscó en Bretaña y Tahití un color primitivo y simbólico. Su rechazo del naturalismo europeo abrió camino al modernismo del siglo XX.',
    },
    paintings: [
      p('gauguin-arearea', 'Paul_Gauguin_-_Arearea_-_Google_Art_Project.jpg', 'Arearea', 1892, 'Dos mujeres tahitianas flanquean un perro rojo en un paisaje de templos y palmeras. Gauguin mezcla memoria europea y fantasía oceánica en uno de sus lienzos más celebrados de la primera estancia en Polinesia.', 75, 94),
      p('gauguin-vision-sermon', 'Paul_Gauguin_-_Vision_after_the_Sermon_-_Google_Art_Project.jpg', 'Visión tras el sermón', 1888, 'Bretonas en oración contemplan la lucha de Jacob con el ángel en un campo rojo. Gauguin separa lo visible de lo visionario con un tronco inclinado que actúa como umbral simbólico.', 73, 92),
      p('gauguin-cristo-amarillo', 'Paul_Gauguin_-_The_Yellow_Christ_-_Google_Art_Project.jpg', 'El Cristo amarillo', 1889, 'Cristo crucificado sobre un fondo amarillo intenso con campesinas bretonas al fondo. La simplificación formal y el color plano anticipan el simbolismo y el primitivismo moderno.', 92, 73),
      p('gauguin-mujeres-tahiti', 'Paul_Gauguin_-_Two_Tahitian_Women_-_Google_Art_Project.jpg', 'Dos mujeres tahitianas', 1899, 'Figuras majestuosas sostienen frutos tropicales ante un paisaje exótico. Gauguin idealiza la vida insular mientras incorpora referencias a la escultura maorí y al color puro.', 94, 72),
    ],
  },
  'georges-seurat': {
    meta: {
      id: 'georges-seurat',
      name: 'Georges Seurat',
      category: 'impresionismo-postimpresionismo',
      fullName: 'Georges Pierre Seurat',
      years: '1859 – 1891',
      origin: 'París, Francia',
      bio: 'Inventor del puntillismo y del neoimpresionismo científico. Seurat construyó escenas modernas de ocio parisino mediante millones de puntos de color puro que el ojo mezcla a distancia.',
    },
    paintings: [
      p('seurat-domingo-grande-jatte', 'Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg', 'Un domingo por la tarde en la isla de La Grande Jatte', 1886, 'Parisienses pasean y descansan a orillas del Sena en una composición monumental de puntos de color. Obra cumbre del neoimpresionismo que transformó el paisaje de ocio en laboratorio óptico.', 207, 308),
      p('seurat-circo', 'Georges_Seurat_-_The_Circus_-_Google_Art_Project.jpg', 'El circo', 1891, 'Acróbata ecuestre y público captados con arabescos de color puro bajo la lona del circo. Última gran obra de Seurat, inacabada a su muerte, resume su fascinación por el espectáculo moderno.', 185, 150),
      p('seurat-banistas-asnieres', 'Georges_Seurat_-_Bathers_at_Asni%C3%A8res_-_Google_Art_Project.jpg', 'Bañistas en Asnières', 1884, 'Obreros y familias descansan junto al Sena bajo un sol difuso de puntos claros. Antecedente directo de La Grande Jatte, con figuras más estáticas y una paleta luminosa de ocio suburbano.', 201, 300),
      p('seurat-modelos', 'Georges_Seurat_-_Models_-_Google_Art_Project.jpg', 'Modelos', 1888, 'Desnudos femeninos posan ante lienzos que evocan obras maestras del pasado. Seurat reflexiona sobre el arte, el cuerpo y la tradición académica desde su método puntillista.', 200, 250),
    ],
  },
  'camille-pissarro': {
    meta: {
      id: 'camille-pissarro',
      name: 'Camille Pissarro',
      category: 'impresionismo-postimpresionismo',
      fullName: 'Jacob Abraham Camille Pissarro',
      years: '1830 – 1903',
      origin: 'Charlotte Amalie, Islas Vírgenes (Danish West Indies)',
      bio: 'Padre mayor del impresionismo y único artista presente en las ocho exposiciones del grupo. Paisajista y retratista de la vida rural y urbana, mentor de Cézanne, Gauguin y Seurat.',
    },
    paintings: [
      p('pissarro-bulevar-montmartre', 'Camille_Pissarro_-_Boulevard_Montmartre,_Spring_-_Google_Art_Project.jpg', 'Bulevar Montmartre, primavera', 1897, 'Serie sobre el bulevar parisino desde la ventana del hotel de Pissarro. Carruajes, árboles y edificios se disuelven en pinceladas rápidas que captan la atmósfera cambiante de la ciudad moderna.', 65, 81),
      p('pissarro-tejados-rojos', 'Camille_Pissarro_-_The_Red_Roofs_-_Google_Art_Project.jpg', 'Los tejados rojos', 1877, 'Tejados y chimeneas de un pueblo vistos desde una ladera. Pissarro traduce el paisaje rural francés con color constructivo y una perspectiva elevada típica de su madurez impresionista.', 54, 65),
      p('pissarro-teatro-frances', 'Camille_Pissarro_-_Place_du_Th%C3%A9%C3%A2tre_Fran%C3%A7ais,_Paris_-_Google_Art_Project.jpg', 'Plaza del Teatro Francés, París', 1898, 'Vista urbana con carruajes y peatones ante el teatro parisino. Pissarro explora la serie pictórica sobre la metrópolis con la misma atención que Monet dedicó a la catedral de Rouen.', 65, 54),
      p('pissarro-huerto-eragny', 'Camille_Pissarro_-_The_Artist%27s_Garden_at_%C3%89ragny_-_Google_Art_Project.jpg', 'El jardín del artista en Éragny', 1898, 'Huerto floreciente en la granja normanda donde Pissarro pasó sus últimos años. Luz suave y pincelada divisionista unen naturaleza cultivada y intimidad doméstica.', 73, 60),
    ],
  },
  'henri-de-toulouse-lautrec': {
    meta: {
      id: 'henri-de-toulouse-lautrec',
      name: 'Henri de Toulouse-Lautrec',
      category: 'impresionismo-postimpresionismo',
      fullName: 'Henri Marie Raymond de Toulouse-Lautrec-Monfa',
      years: '1864 – 1901',
      origin: 'Albi, Francia',
      bio: 'Cronista gráfico del París nocturno de fin de siglo. Sus carteles, litografías y lienzos sobre el Moulin Rouge, las danzarinas y los cafés-concert capturaron la modernidad con línea audaz y color plano.',
    },
    paintings: [
      p('lautrec-moulin-rouge', 'Henri_de_Toulouse-Lautrec_-_At_the_Moulin_Rouge_-_Google_Art_Project.jpg', 'En el Moulin Rouge', 1892, 'Escena nocturna del cabaret parisino con figuras de perfil y rostro en primer plano. Lautrec retrata la vida bohemia con recortes compositivos inspirados en la fotografía y el ukiyo-e.', 123, 141),
      p('lautrec-baile-moulin', 'Henri_de_Toulouse-Lautrec_-_The_Dance_at_the_Moulin_Rouge_-_Google_Art_Project.jpg', 'El baile en el Moulin Rouge', 1890, 'Parejas bailan bajo las luces del local mientras el público observa desde las mesas. Lautrec condensa el movimiento y el bullicio del ocio popular montmartrense.', 115, 150),
      p('lautrec-jane-avril', 'Henri_de_Toulouse-Lautrec_-_Jane_Avril_-_Google_Art_Project.jpg', 'Jane Avril', 1891, 'Retrato de la célebre bailarina del Moulin Rouge con falda en movimiento. Lautrec captura su elegancia nerviosa y la energía del espectáculo parisino en contornos sinuosos.', 97, 130),
      p('lautrec-cama', 'Henri_de_Toulouse-Lautrec_-_In_Bed_-_Google_Art_Project.jpg', 'En la cama', 1893, 'Dos figuras abrazadas bajo sábanas blancas en un interior íntimo. Lautrec retrata la intimidad sin idealización, con una sensibilidad poco habitual en la pintura de cabaret.', 54, 70),
    ],
  },
  'berthe-morisot': {
    meta: {
      id: 'berthe-morisot',
      name: 'Berthe Morisot',
      category: 'impresionismo-postimpresionismo',
      fullName: 'Berthe Marie Pauline Morisot',
      years: '1841 – 1895',
      origin: 'Bourges, Francia',
      bio: 'Impresionista esencial y miembro fundador del grupo. Morisot pintó la vida burguesa femenina, la infancia y los jardines con pincelada ligera y una sensibilidad íntima que amplió el canon impresionista.',
    },
    paintings: [
      p('morisot-cuna', 'Berthe_Morisot_-_The_Cradle_-_Google_Art_Project.jpg', 'La cuna', 1872, 'Madre contempla a su hija dormida en una cuna de mimbre. Morisot transforma la escena doméstica en meditación sobre la maternidad con color claro y composición diagonal.', 56, 46),
      p('morisot-dia-verano', 'Berthe_Morisot_-_Summer%27s_Day_-_Google_Art_Project.jpg', 'Día de verano', 1879, 'Dos mujeres en un bote sobre un estanque parisino bajo la luz del mediodía. Morisot captura el ocio femenino al aire libre con reflejos acuáticos y pincelada suelta.', 45, 75),
      p('morisot-comedor', 'Berthe_Morisot_-_In_the_Dining_Room_-_Google_Art_Project.jpg', 'En el comedor', 1886, 'Niña y sirvienta en un interior burgués iluminado lateralmente. Morisot observa la vida privada con la misma atención psicológica que Degas dedicaba al ballet.', 61, 50),
      p('morisot-lectura', 'Berthe_Morisot_-_Reading_-_Google_Art_Project.jpg', 'Lectura', 1873, 'Joven leyendo en un sofá junto a una ventana luminosa. Escena íntima donde la figura se funde con el ambiente mediante tonos claros y pincelada vibrante.', 74, 60),
    ],
  },
  'gustave-courbet': {
    meta: {
      id: 'gustave-courbet',
      name: 'Gustave Courbet',
      category: 'neoclasicismo-romanticismo',
      fullName: 'Jean Désiré Gustave Courbet',
      years: '1819 – 1877',
      origin: 'Ornans, Francia',
      bio: 'Líder del realismo francés que rechazó la pintura académica idealizada. Courbet pintó campesinos, paisajes y escenas cotidianas con escala monumental y crudeza que escandalizó al Salón parisino.',
    },
    paintings: [
      p('courbet-taller', 'Gustave_Courbet_-_The_Artist%27s_Studio_-_Google_Art_Project.jpg', 'El taller del pintor', 1855, 'Autorretrato alegórico donde Courbet se presenta rodeado de amigos, modelos y personajes simbólicos. Manifiesto visual del realismo que explica su concepción del arte y la sociedad.', 361, 598),
      p('courbet-entierro-ornans', 'Gustave_Courbet_-_A_Burial_at_Ornans_-_Google_Art_Project.jpg', 'Entierro en Ornans', 1849, 'Funeral campesino en escala histórica que elevó la vida rural a tema digno de gran lienzo. Courbet desafió la jerarquía académica de géneros con una escena provincial sin héroes ni pathos retórico.', 315, 668),
      p('courbet-desesperado', 'Gustave_Courbet_-_The_Desperate_Man_(Self-Portrait)_-_Google_Art_Project.jpg', 'El hombre desesperado (Autorretrato)', 1843, 'Courbet se agarra el pelo con los ojos desorbitados en un autorretrato de intensidad romántica. Obra temprana que anticipa su búsqueda de expresión cruda y directa.', 54, 45),
      p('courbet-piedras', 'Gustave_Courbet_-_The_Stone_Breakers_-_Google_Art_Project.jpg', 'Los quebrantadores de piedra', 1849, 'Dos obreros destrozando rocas en un camino rural. Courbet dignifica el trabajo manual con una escala antes reservada a la historia y provocó el rechazo del establishment artístico.', 170, 240),
      p('courbet-olas', 'Gustave_Courbet_-_The_Wave_-_Google_Art_Project.jpg', 'La ola', 1870, 'Mar embravecido que ocupa casi todo el lienzo con espuma y roca oscura. Courbet pinta la naturaleza con fuerza materialista, sin romanticismo decorativo.', 66, 90),
    ],
  },
  'john-constable': {
    meta: {
      id: 'john-constable',
      name: 'John Constable',
      category: 'neoclasicismo-romanticismo',
      fullName: 'John Constable',
      years: '1776 – 1837',
      origin: 'East Bergholt, Suffolk, Inglaterra',
      bio: 'Paisajista romántico británico que pintó el campo de Suffolk con observación directa del clima y la luz. Su influencia en la pintura europea del siglo XIX, especialmente en Delacroix, fue decisiva.',
    },
    paintings: [
      p('constable-carro-heno', 'John_Constable_-_The_Hay_Wain_-_Google_Art_Project.jpg', 'El carro de heno', 1821, 'Carro atravesando un vado del río Stour con un molino al fondo. Obra emblemática del paisaje inglés que Constable presentó en París y que influyó en los románticos franceses.', 130, 185),
      p('constable-valle-dedham', 'John_Constable_-_Dedham_Vale_-_Google_Art_Project.jpg', 'Valle de Dedham', 1828, 'Vista panorámica del valle natal con campos, árboles y la torre de la iglesia al fondo. Constable captura la atmósfera húmeda del Suffolk con nubes cargadas de lluvia.', 120, 145),
      p('constable-campo-maiz', 'John_Constable_-_The_Cornfield_-_Google_Art_Project.jpg', 'El campo de maíz', 1826, 'Pastor con rebaño avanza por un sendero entre campos de trigo y un arroyo. Constable idealiza el campo inglés con naturalismo poético y detalle botánico.', 143, 122),
      p('constable-salisbury', 'John_Constable_-_Salisbury_Cathedral_from_the_Meadows_-_Google_Art_Project.jpg', 'Catedral de Salisbury desde los prados', 1831, 'La catedral gótica surge tras un prado mojado bajo un arcoíris tormentoso. Constable combina topografía precisa y drama romántico del cielo.', 151, 189),
    ],
  },
  'artemisia-gentileschi': {
    meta: {
      id: 'artemisia-gentileschi',
      name: 'Artemisia Gentileschi',
      category: 'barroco',
      fullName: 'Artemisia Gentileschi',
      years: '1593 – c. 1656',
      origin: 'Roma, Estados Pontificios',
      bio: 'Pintora barroca italiana formada en el taller de su padre Orazio y en la órbita caravaggesca. Sus heroínas bíblicas, retratos regios y escenas de violencia y justicia redefinieron la pintura femenina del Seicento.',
    },
    paintings: [
      p('gentileschi-judith-holofernes', 'Artemisia_Gentileschi_-_Judith_beheading_Holofernes_-_Google_Art_Project.jpg', 'Judith decapitando a Holofernes', 1620, 'Judith y su criada decapitan al general asirio con una violencia física sin precedentes. Gentileschi convierte el episodio bíblico en drama barroco de acción y claroscuro tenso.', 146, 199),
      p('gentileschi-judith-sirvienta', 'Artemisia_Gentileschi_-_Judith_and_Her_Maidservant_-_Google_Art_Project.jpg', 'Judith y su criada', 1613, 'Las dos mujeres ocultan la cabeza de Holofernes mientras escuchan un ruido en la oscuridad. Gentileschi concentra la tensión en gestos contenidos y luz lateral caravaggesca.', 114, 93),
      p('gentileschi-susana', 'Artemisia_Gentileschi_-_Susanna_and_the_Elders_-_Google_Art_Project.jpg', 'Susana y los viejos', 1610, 'Susana rechaza a los ancianos que la espían en el baño. Obra temprana que ya muestra la capacidad de Gentileschi para dramatizar la vulnerabilidad y la resistencia femeninas.', 170, 119),
      p('gentileschi-autorretrato-pintura', 'Artemisia_Gentileschi_-_Self-Portrait_as_the_Allegory_of_Painting_-_Google_Art_Project.jpg', 'Autorretrato como alegoría de la Pintura', 1638, 'La artista se representa como la Pintura personificada, con delantal manchado y brazo en movimiento. Autorretrato programático que afirma su lugar entre los grandes pintores de su tiempo.', 96, 74),
      p('gentileschi-jael', 'Artemisia_Gentileschi_-_Jael_and_Sisera_-_Google_Art_Project.jpg', 'Jael y Sísara', 1620, 'Jael clava una estaca en el cráneo del general cananeo. Gentileschi elige de nuevo una heroína bíblica que actúa con determinación en una escena de violencia justificada.', 86, 105),
    ],
  },
  'hans-holbein-el-joven': {
    meta: {
      id: 'hans-holbein-el-joven',
      name: 'Hans Holbein el Joven',
      category: 'renacimiento-manierismo',
      fullName: 'Hans Holbein der Jüngere',
      years: 'c. 1497 – 1543',
      origin: 'Augsburgo, Sacro Imperio Romano',
      bio: 'Retratista renacentista de la corte inglesa de Enrique VIII y pintor de la Reforma. Holbein combinó precisión flamenga con elegancia italiana en retratos que definen la imagen del poder Tudor.',
    },
    paintings: [
      p('holbein-embajadores', 'Hans_Holbein_the_Younger_-_The_Ambassadors_-_Google_Art_Project.jpg', 'Los embajadores', 1533, 'Dos diplomáticos franceses rodeados de instrumentos científicos y un cráneo distorsionado en anamorfosis. Obra maestra del retrato renacentista que mezcla erudición, poder y vanitas.', 207, 209),
      p('holbein-enrique-viii', 'Hans_Holbein_the_Younger_-_Portrait_of_Henry_VIII_-_Google_Art_Project.jpg', 'Retrato de Enrique VIII', 1537, 'El monarca Tudor en pose majestuosa con ropas bordadas y mirada imperiosa. Holbein fijó la imagen icónica del rey que dominaría la iconografía inglesa durante siglos.', 28, 19),
      p('holbein-erasmo', 'Hans_Holbein_the_Younger_-_Erasmus_of_Rotterdam_-_Google_Art_Project.jpg', 'Erasmo de Róterdam', 1523, 'El humanista escribe en su estudio con libros y expresión concentrada. Holbein retrata al intelectual más influyente de Europa con sobriedad y detalle casi miniaturístico.', 43, 32),
      p('holbein-tomas-mor', 'Hans_Holbein_the_Younger_-_Portrait_of_Sir_Thomas_More_-_Google_Art_Project.jpg', 'Retrato de sir Tomás Moro', 1527, 'El estadista y autor de Utopia posa con cadena de oro y expresión grave. Holbein captura la dignidad intelectual de uno de los hombres más cultos del Renacimiento inglés.', 74, 59),
    ],
  },
  'pieter-bruegel-el-viejo': {
    meta: {
      id: 'pieter-bruegel-el-viejo',
      name: 'Pieter Bruegel el Viejo',
      category: 'renacimiento-manierismo',
      fullName: 'Pieter Bruegel',
      years: 'c. 1525 – 1569',
      origin: 'Breda o Breugel, Condado de Henao (Países Bajos)',
      bio: 'Pintor flamenco de escenas campesinas, paisajes y alegorías morales. Bruegel observó el mundo rural y popular con ironía y detalle que convirtieron sus lienzos en crónicas visuales del siglo XVI.',
    },
    paintings: [
      p('bruegel-cazadores-nieve', 'Pieter_Bruegel_the_Elder_-_Hunters_in_the_Snow_-_Google_Art_Project.jpg', 'Cazadores en la nieve', 1565, 'Primera escena de la serie de los meses. Cazadores regresan en invierno mientras el valle nevado se extiende hacia un pueblo con patinadores sobre el hielo.', 117, 162),
      p('bruegel-torre-babel', 'Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project.jpg', 'La torre de Babel', 1563, 'Torre colosal inspirada en el Coliseo romano que se eleva sobre un puerto flamenco. Bruegel dramatiza la soberbia humana con arquitectura imposible y multitudes diminutas.', 114, 155),
      p('bruegel-boda-campesina', 'Pieter_Bruegel_the_Elder_-_The_Peasant_Wedding_-_Google_Art_Project.jpg', 'La boda campesina', 1567, 'Banquete popular en un granero donde invitados comen, beben y conversan con naturalidad. Bruegel dignifica la vida campesina sin idealización ni condescendencia.', 114, 164),
      p('bruegel-caida-icaro', 'Pieter_Bruegel_the_Elder_-_Landscape_with_the_Fall_of_Icarus_-_Google_Art_Project.jpg', 'Paisaje con la caída de Ícaro', 1560, 'Pastor, arado y barca continúan su labor mientras Ícaro cae al mar casi invisible. Bruegel subvierte el mito clásico mostrando la indiferencia del mundo ante la tragedia individual.', 73, 112),
    ],
  },
  'jean-honore-fragonard': {
    meta: {
      id: 'jean-honore-fragonard',
      name: 'Jean-Honoré Fragonard',
      category: 'barroco',
      fullName: 'Jean-Honoré Nicolas Fragonard',
      years: '1732 – 1806',
      origin: 'Grasse, Francia',
      bio: 'Maestro del rococó tardío francés, especialista en escenas galantes, paisajes luminosos y retratos íntimos. Fragonard pintó el placer aristocrático con pincelada suelta y color brillante antes de la Revolución.',
    },
    paintings: [
      p('fragonard-columpio', 'Jean-Honor%C3%A9_Fragonard_-_The_Swing_-_Google_Art_Project.jpg', 'El columpio', 1767, 'Joven en un columpio lanza su zapato mientras un cortesano oculto contempla desde la maleza. Obra cumbre del rococó erótico con luz filtrada y vegetación exuberante.', 81, 64),
      p('fragonard-beso-robado', 'Jean-Honor%C3%A9_Fragonard_-_The_Stolen_Kiss_-_Google_Art_Project.jpg', 'El beso robado', 1780, 'Pareja se besa a escondidas en un palco o pasillo íntimo. Fragonard captura el instante furtivo del deseo con color cálido y composición teatral.', 45, 36),
      p('fragonard-lectura', 'Jean-Honor%C3%A9_Fragonard_-_A_Young_Girl_Reading_-_Google_Art_Project.jpg', 'Joven leyendo', 1776, 'Muchacha absorta en un libro sobre un diván con cojines amarillos. Retrato íntimo donde la lectura se convierte en escena de recogimiento y elegancia doméstica.', 81, 65),
      p('fragonard-amor-escultor', 'Jean-Honor%C3%A9_Fragonard_-_Love_as_Folly_-_Google_Art_Project.jpg', 'El amor como locura', 1775, 'Cupido como loco con campanas y figuras alegóricas en un paisaje fantástico. Fragonard mezcla mitología, teatro y humor en una escena rococó de enérgica pincelada.', 70, 90),
    ],
  },
};

const ADDITIONS = {
  caravaggio: [
    p('caravaggio-judith-holofernes', 'Caravaggio_-_Judith_Beheading_Holofernes_-_Google_Art_Project.jpg', 'Judith decapitando a Holofernes', 1599, 'Judith y su criada decapitan al general dormido con una crudeza que escandalizó a Roma. Caravaggio convierte el episodio bíblico en teatro de violencia y claroscuro extremo.', 145, 195),
    p('caravaggio-narciso', 'Caravaggio_-_Narcissus_at_the_Source_-_Google_Art_Project.jpg', 'Narciso', 1597, 'El joven contempla su reflejo en el agua en una composición circular casi perfecta. Caravaggio fusiona mitología clásica y naturalismo obsesivo en una meditación sobre la vanidad.', 114, 92),
    p('caravaggio-cena-emmaus', 'Caravaggio_-_Supper_at_Emmaus_(London)_-_Google_Art_Project.jpg', 'La cena de Emaús', 1601, 'Cristo revelado entre dos discípulos en el instante del reconocimiento. Gestos teatrales y frutas precarias sobre la mesa condensan la fe barroca en una escena de taverna.', 141, 196),
  ],
  'pierre-auguste-renoir': [
    p('renoir-gran-banista', 'Pierre-Auguste_Renoir_-_The_Large_Bather_-_Google_Art_Project.jpg', 'La gran bañista', 1887, 'Desnudo femenino clásico con pincelada suave y contornos redondeados. Renoir retoma la tradición académica del baño con la sensualidad luminosa de su madurez.', 117, 88),
    p('renoir-mujeres-jardin', 'Pierre-Auguste_Renoir_-_Women_in_the_Garden_-_Google_Art_Project.jpg', 'Mujeres en el jardín', 1866, 'Cuatro figuras femeninas entre flores bajo la luz filtrada de un árbol. Obra temprana donde Renoir experimenta con la luz al aire libre antes del impresionismo pleno.', 213, 265),
    p('renoir-bañistas', 'Pierre-Auguste_Renoir_-_The_Bathers_-_Google_Art_Project.jpg', 'Las bañistas', 1918, 'Grupo de desnudos femeninos en un paisaje arcadiano de su última etapa. Renoir condensa su ideal de belleza clásica y color carnal en una escena de ocio campestre.', 160, 110),
  ],
  'alberto-durero': [
    p('durero-adam-eva', 'Albrecht_D%C3%BCrer_-_Adam_and_Eve_-_Google_Art_Project.jpg', 'Adán y Eva', 1507, 'Primeros padres en simetría perfecta ante un bosque habitado por animales simbólicos. Durero sintetiza proporción renacentista italiana y minuciosidad nórdica en un desnudo ideal.', 209, 81),
    p('durero-caballero-muerte', 'Albrecht_D%C3%BCrer_-_Knight,_Death_and_the_Devil_-_Google_Art_Project.jpg', 'Caballero, la Muerte y el Diablo', 1513, 'Grabado donde un caballero avanza impasible entre la muerte esquelética y un demonio. Alegoría moral de la virtud cristiana frente a la tentación y la mortalidad.', 24, 19),
  ],
  'el-greco': [
    p('greco-anunciacion', 'El_Greco_-_The_Annunciation_-_Google_Art_Project.jpg', 'La Anunciación', 1576, 'Arcángel Gabriel anuncia a la Virgen en un espacio vertical de color frío y figuras alargadas. El Greco adapta la tradición bizantina a la espiritualidad manierista toledana.', 114, 105),
    p('greco-apostoles', 'El_Greco_-_The_Apostles_Peter_and_Paul_-_Google_Art_Project.jpg', 'Los apóstoles Pedro y Pablo', 1592, 'Dos fundadores de la Iglesia conversan con gestos enfáticos y rostros iluminados. El Greco dramatiza el encuentro teológico con su característico alargamiento y color incandescente.', 121, 105),
  ],
  'francisco-de-zurbaran': [
    p('zurbaran-francisco-exaltacion', 'Francisco_de_Zurbar%C3%A1n_-_Saint_Francis_in_Ecstasy_-_Google_Art_Project.jpg', 'San Francisco en éxtasis', 1635, 'El santo contempla un cráneo mientras un ángel le susurra al oído en la oscuridad. Zurbarán convierte la devoción franciscana en meditación sobria de luz y silencio.', 152, 99),
    p('zurbaran-virgen-ildefonso', 'Francisco_de_Zurbar%C3%A1n_-_The_Apparition_of_the_Virgin_to_Saint_Ildefonso_-_Google_Art_Project.jpg', 'Aparición de la Virgen a san Ildefonso', 1635, 'La Virgen entrega una casulla al obispo arrodillado ante un altar. Zurbarán organiza la escena con claridad teatral y blancos luminosos sobre fondo oscuro.', 179, 232),
  ],
  'johannes-vermeer': [
    p('vermeer-diana', 'Johannes_Vermeer_-_Diana_and_Her_Companions_-_Google_Art_Project.jpg', 'Diana y sus compañeras', 1655, 'Diana y sus ninfas descansan en un paisaje clásico con luz suave. Obra temprana donde Vermeer aún dialoga con la pintura de historia antes de especializarse en escenas domésticas.', 98, 105),
    p('vermeer-arte-pintura', 'Johannes_Vermeer_-_The_Art_of_Painting_-_Google_Art_Project.jpg', 'El arte de la pintura', 1668, 'Pintor retrata a una modelo vestida de Clío ante un mapa y un candelabro. Vermeer medita sobre su propio oficio con una escena enigmática de luz y perspectiva.', 120, 100),
  ],
  rembrandt: [
    p('rembrandt-novia-judia', 'Rembrandt_-_The_Jewish_Bride_-_Google_Art_Project.jpg', 'La novia judía', 1667, 'Pareja en un abrazo tierno con pincelada espesa de oro y rojo. Rembrandt pinta el amor conyugal con una intimidad que trasciende el retrato convencional.', 121, 166),
    p('rembrandt-danae', 'Rembrandt_-_Dana%C3%AB_-_Google_Art_Project.jpg', 'Danae', 1636, 'La princesa recibe a Zeus transformado en lluvia de oro. Rembrandt dramatiza el mito con luz dorada que inunda el lecho y una sensualidad barroca contenida.', 185, 203),
  ],
  'leonardo-da-vinci': [
    p('leonardo-dama-ermellino', 'Leonardo_da_Vinci_-_Lady_with_an_Ermine_-_Google_Art_Project.jpg', 'Dama del armiño', 1490, 'Cecilia Gallerani sostiene un armiño mientras gira la cabeza con vivacidad. Leonardo captura movimiento psicológico y anatomía animal con maestría renacentista.', 54, 39),
    p('leonardo-san-juan-bautista', 'Leonardo_da_Vinci_-_Saint_John_the_Baptist_-_Google_Art_Project.jpg', 'San Juan Bautista', 1516, 'El santo señala hacia arriba con sonrisa enigmática en un fondo de sfumato oscuro. Obra tardía donde Leonardo condensa misterio, anatomía y luz en una sola figura.', 69, 57),
  ],
  'sandro-botticelli': [
    p('botticelli-calumnia', 'Sandro_Botticelli_-_The_Calumny_of_Apelles_-_Google_Art_Project.jpg', 'La calumnia de Apeles', 1495, 'Alegoría basada en un texto de Luciano con figuras de la calumnia, la envidia y la verdad. Botticelli traduce la erudición clásica en una escena narrativa de precisión lineal.', 62, 91),
    p('botticelli-adoracion-magos', 'Sandro_Botticelli_-_Adoration_of_the_Magi_of_1475_-_Google_Art_Project.jpg', 'Adoración de los Magos', 1475, 'Epifanía con multitud de personajes entre los que aparecen miembros de la familia Médici. Botticelli combina devoción, retrato y arquitectura renacentista en un tapiz humano.', 111, 134),
  ],
  'edouard-manet': [
    p('manet-folies-bergere', 'Edouard_Manet_-_A_Bar_at_the_Folies-Berg%C3%A8re_-_Google_Art_Project.jpg', 'El bar del Folies-Bergère', 1882, 'Camarera detrás de un mostrador abarrotado mientras el espejo multiplica el local y un hombre conversa con ella. Manet explora la modernidad parisina, la mirada y la ilusión pictórica.', 96, 130),
    p('manet-ejecucion-maximiliano', 'Edouard_Manet_-_The_Execution_of_Emperor_Maximilian_-_Google_Art_Project.jpg', 'La ejecución del emperador Maximiliano', 1867, 'Fusilamiento del emperador austriaco en México captado con frialdad casi reportística. Manet denuncia la política imperial con una escena que evoca a Goya y anticipa el arte moderno.', 250, 305),
  ],
  'edgar-degas': [
    p('degas-repeticion', 'Edgar_Degas_-_The_Rehearsal_of_the_Ballet_Onstage_-_Google_Art_Project.jpg', 'Ensayo de ballet en escena', 1874, 'Bailarinas ensayan en escena mientras figuras del teatro observan desde la oscuridad. Degas captura el instante casual del espectáculo con recortes audaces y pastel sobre monotipo.', 54, 73),
    p('degas-peinado', 'Edgar_Degas_-_Combing_the_Hair_-_Google_Art_Project.jpg', 'Peinándose', 1888, 'Mujer peina a otra en un interior íntimo de tonos rosados y ocres. Degas aplica pastel con crudeza casi escultórica en una escena de vida privada lejos del escenario.', 114, 146),
  ],
  'jan-van-eyck': [
    p('van-eyck-madonna-fuente', 'Jan_van_Eyck_-_Madonna_at_the_Fountain_-_Google_Art_Project.jpg', 'Madonna de la fuente', 1439, 'Virgen con el Niño junto a una fuente gótica en un jardín cerrado. Van Eyck combina simbolismo mariano y detalle flamenco minucioso en un panel devocional de formato vertical.', 19, 13),
    p('van-eyck-adoracion-cordero', 'Jan_van_Eyck_-_The_Ghent_Altarpiece_-_Google_Art_Project.jpg', 'La adoración del Cordero místico', 1432, 'Panel central del retablo de Gante con multitudes adorando al Cordero sobre un altar. Obra cumbre del primitivo flamenco que Van Eyck ejecutó con su taller.', 461, 350),
  ],
  'antoine-watteau': [
    p('watteau-comediantes', 'Antoine_Watteau_-_The_Italian_Comedians_-_Google_Art_Project.jpg', 'Los comediantes italianos', 1720, 'Actores de la commedia dell\'arte posan en un paisaje abierto con Pierrot al centro. Watteau funde teatro, música y melancolía en la despedida de su estilo galante.', 89, 108),
    p('watteau-mezzetin', 'Antoine_Watteau_-_The_Mezzetin_-_Google_Art_Project.jpg', 'El Mezzetino', 1718, 'Músico de teatro toca la guitarra con gesto melancólico en un parque crepuscular. Watteau retrata la soledad del personaje cómico con pincelada ligera y color poético.', 55, 43),
  ],
  'aubrey-beardsley': [
    p('beardsley-salome', 'Aubrey_Beardsley_-_Salome_-_Google_Art_Project.jpg', 'Salomé', 1893, 'Salomé en traje decorativo con motivos florales y arabescos negros. Beardsley define el art nouveau británico con línea pura y erotismo simbólico finisecular.', 23, 18),
    p('beardsley-john-salome', 'Aubrey_Beardsley_-_John_and_Salome_-_Google_Art_Project.jpg', 'Juan y Salomé', 1893, 'Ilustración para la Salomé de Wilde con figuras estilizadas y fondo blanco absoluto. Beardsley condensa teatro y decadencia en un dibujo de contornos extremos.', 23, 18),
  ],
  'edvard-munch': [
    p('munch-nino-enfermo', 'Edvard_Munch_-_The_Sick_Child_-_Google_Art_Project.jpg', 'La niña enferma', 1907, 'Niña pálida en la almohada mientras una mujer acompaña su agonía. Munch revisita el recuerdo de la muerte de su hermana con color desgarrado y pincelada temblorosa.', 118, 121),
    p('munch-ansiedad', 'Edvard_Munch_-_Anxiety_-_Google_Art_Project.jpg', 'Ansiedad', 1894, 'Multitud de figuras verdes camina junto al fiordo de Oslo con rostros anónimos. Munch traduce la angustia colectiva en un paisaje simbolista de línea ondulante.', 94, 74),
  ],
  'emanuel-leutze': [
    p('leutze-columbus-landing', 'Emanuel_Leutze_-_Landing_of_Columbus_-_Google_Art_Project.jpg', 'Desembarco de Colón', 1847, 'Colón planta la cruz en América mientras marinos e indígenas observan. Leutze dramatiza el encuentro histórico con retórica romántica y escala monumental.', 130, 97),
    p('leutze-hudson', 'Emanuel_Leutze_-_The_Settlement_on_the_Hudson_-_Google_Art_Project.jpg', 'Asentamiento en el Hudson', 1862, 'Colonos y navegantes fundan un poblado a orillas del río Hudson. Leutze celebra la expansión americana con figuras alegóricas y paisaje romántico.', 130, 97),
  ],
  'fra-angelico': [
    p('angelico-transito', 'Fra_Angelico_-_The_Transit_of_the_Virgin_-_Google_Art_Project.jpg', 'Tránsito de la Virgen', 1432, 'Apóstoles rodean el lecho de la Virgen en una arquitectura renacentista luminosa. Fra Angelico traduce la devoción dominica en color claro y composición serena.', 213, 165),
    p('angelico-cosme-damian', 'Fra_Angelico_-_Saints_Cosmas_and_Damian_-_Google_Art_Project.jpg', 'San Cosme y San Damián', 1438, 'Médicos santos en oración ante un paisaje toscano. Fra Angelico combina retrato devocional y perspectiva temprana con la calma espiritual de San Marco.', 38, 46),
  ],
  'gustav-klimt': [
    p('klimt-atene', 'Gustav_Klimt_-_Pallas_Athena_-_Google_Art_Project.jpg', 'Palas Atenea', 1898, 'La diosa de la sabiduría con armadura dorada y mirada severa. Klimt funde simbolismo vienés y decoración bizantina en una figura de poder femenino.', 75, 75),
    p('klimt-arbol-vida', 'Gustav_Klimt_-_The_Tree_of_Life,_Stoclet_Frieze_-_Google_Art_Project.jpg', 'El árbol de la vida', 1909, 'Árbol simétrico con espirales doradas del frieze Stoclet. Klimt condensa vida, crecimiento y ornamento en un emblema del modernismo decorativo.', 280, 280),
  ],
  'henri-rousseau': [
    p('rousseau-futbolistas', 'Henri_Rousseau_-_The_Football_Players_-_Google_Art_Project.jpg', 'Los futbolistas', 1908, 'Jugadores de rugby o fútbol saltan entre árboles en un parque parisino. Rousseau pinta el deporte moderno con ingenuidad deliberada y vegetación imaginaria.', 100, 80),
    p('rousseau-autorretrato', 'Henri_Rousseau_-_Self-Portrait_-_Google_Art_Project.jpg', 'Autorretrato', 1890, 'El pintor con paleta y pincel ante la Torre Eiffel en construcción. Rousseau se presenta como artista autodidacta orgulloso de su lugar en la París moderna.', 81, 100),
  ],
  'jean-auguste-dominique-ingres': [
    p('ingres-napoleon-trono', 'Jean_Auguste_Dominique_Ingres_-_Napoleon_on_his_Imperial_throne_-_Google_Art_Project.jpg', 'Napoleón en su trono imperial', 1806, 'El emperador en trono dorado con gesto hierático y ropajes imperiales. Ingres fija la imagen del poder napoleónico con rigor neoclásico y detalle miniaturístico.', 259, 162),
    p('ingres-banio-turco', 'Jean_Auguste_Dominique_Ingres_-_The_Turkish_Bath_-_Google_Art_Project.jpg', 'El baño turco', 1862, 'Desnudos femeninos en un hammam circular vistos desde arriba. Obra tardía donde Ingres condensa orientalismo, erotismo académico y virtuosismo lineal.', 108, 108),
  ],
  'john-singer-sargent': [
    p('sargent-jaleo', 'John_Singer_Sargent_-_El_Jaleo_-_Google_Art_Project.jpg', 'El jaleo', 1882, 'Bailarina flamenca en medio de un tablao con guitarras y palmas. Sargent captura el movimiento y el sonido del espectáculo español con pincelada vigorosa y luz teatral.', 237, 352),
    p('sargent-gassed', 'John_Singer_Sargent_-_Gassed_-_Google_Art_Project.jpg', 'Gassed', 1919, 'Soldados ciegos por gas caminan en fila tras una escena de campo de batalla. Sargent documenta la Primera Guerra Mundial con realismo monumental y pathos contenido.', 231, 611),
  ],
  'mary-cassatt': [
    p('cassatt-barco-nino', 'Mary_Cassatt_-_The_Boating_Party_-_Google_Art_Project.jpg', 'La barca', 1893, 'Hombre rema mientras una mujer sostiene a un niño en la proa. Cassatt combina influencia japonesa en el recorte compositivo con intimidad maternal.', 90, 69),
    p('cassatt-summertime', 'Mary_Cassatt_-_Summertime_-_Google_Art_Project.jpg', 'Verano', 1894, 'Dos mujeres en un bote con un pato nadando cerca. Cassatt pinta el ocio femenino veraniego con color claro y composición influenciada por el ukiyo-e.', 100, 81),
  ],
  'melozzo-da-forli': [
    p('melozzo-transfiguracion', 'Melozzo_da_Forl%C3%AC_-_Transfiguration_-_Google_Art_Project.jpg', 'La Transfiguración', 1480, 'Cristo resplandece entre Moisés y Elías ante apóstoles postrados. Melozzo organiza la escena con claridad narrativa y figuras en escorzo anticipando el barroco.', 280, 250),
    p('melozzo-reyes-magos', 'Melozzo_da_Forl%C3%AC_-_Adoration_of_the_Magi_-_Google_Art_Project.jpg', 'Adoración de los Magos', 1480, 'Los Magos adoran al Niño en un paisaje arquitectónico. Melozzo demuestra su maestría en perspectiva y retrato colectivo en una escena devocional umbria.', 280, 250),
  ],
  'nicolas-poussin': [
    p('poussin-bacanal', 'Nicolas_Poussin_-_The_Bacchanal_of_the_Andrians_-_Google_Art_Project.jpg', 'El bacanal de los andrios', 1635, 'Festín mitológico en la isla de Andros con danza, música y vino. Poussin ordena el placer clásico con geometría compositiva y color sobrio.', 122, 175),
    p('poussin-santa-cena', 'Nicolas_Poussin_-_The_Institution_of_the_Eucharist_-_Google_Art_Project.jpg', 'La institución de la Eucaristía', 1640, 'Cristo consagra el pan ante los apóstoles en un interior clásico. Poussin traduce la escena sacramental con claridad racional y figuras escultóricas.', 331, 252),
  ],
  'odilon-redon': [
    p('redon-ojo-globo', 'Odilon_Redon_-_The_eye_like_a_strange_balloon_mounts_toward_infinity_-_Google_Art_Project.jpg', 'El ojo, como un globo extraño, se dirige hacia el infinito', 1882, 'Globo ocular surca un cielo gris sobre un mar desolado. Redon condensa el simbolismo finisecular en una imagen onírica de visión y misterio.', 44, 55),
    p('redon-orfeo', 'Odilon_Redon_-_Orpheus_-_Google_Art_Project.jpg', 'Orfeo', 1903, 'Cabeza flotante de Orfeo cantando entre nubes rosadas. Redon transforma el mito en poema visual de color pastel y forma imaginaria.', 67, 54),
  ],
  'paolo-veronese': [
    p('veronese-cena-emmaus', 'Paolo_Veronese_-_The_Supper_at_Emmaus_-_Google_Art_Project.jpg', 'La cena de Emaús', 1559, 'Cristo revelado en un banquete aristocrático veneciano. Veronese eleva el episóngelico con arquitectura clásica, sirvientes y un despliegue de color y seda.', 240, 550),
    p('veronese-juicio-paris', 'Paolo_Veronese_-_The_Judgement_of_Paris_-_Google_Art_Project.jpg', 'El juicio de Paris', 1570, 'Paris entrega la manzana a Venus entre Juno y Minerva. Veronese convierte el mito en escena de lujo veneciano con figuras monumentales y paisaje luminoso.', 80, 72),
  ],
};

const INDEX_INSERTIONS = {
  'renacimiento-manierismo': ['hans-holbein-el-joven', 'pieter-bruegel-el-viejo'],
  barroco: ['artemisia-gentileschi', 'jean-honore-fragonard'],
  'neoclasicismo-romanticismo': ['gustave-courbet', 'john-constable'],
  'impresionismo-postimpresionismo': [
    'camille-pissarro',
    'paul-gauguin',
    'georges-seurat',
    'henri-de-toulouse-lautrec',
    'berthe-morisot',
  ],
};

async function main() {
  const skipValidate = process.argv.includes('--skip-validate');
  const dryRun = process.argv.includes('--dry-run');

  const existingIds = new Set();
  for (const file of await readdir(authorsDir)) {
    if (!file.endsWith('.json')) continue;
    const author = JSON.parse(await readFile(path.join(authorsDir, file), 'utf8'));
    for (const painting of author.paintings || []) existingIds.add(painting.id);
  }

  const failures = [];
  const toApply = [];

  async function checkPainting(painting, authorSlug) {
    if (existingIds.has(painting.id)) {
      console.log(`SKIP existing id: ${painting.id}`);
      return;
    }
    if (!skipValidate) {
      const { ok, status, type } = await validateImageUrl(painting.url);
      if (!ok) {
        failures.push({ authorSlug, id: painting.id, url: painting.url, status, type });
        return;
      }
      console.log(`OK ${painting.id}`);
    }
    toApply.push({ authorSlug, painting });
  }

  for (const [slug, data] of Object.entries(NEW_AUTHORS)) {
    for (const painting of data.paintings) await checkPainting(painting, slug);
  }
  for (const [slug, paintings] of Object.entries(ADDITIONS)) {
    for (const painting of paintings) await checkPainting(painting, slug);
  }

  if (failures.length) {
    console.error('\nURL failures:');
    for (const f of failures) console.error(JSON.stringify(f));
    process.exit(1);
  }

  console.log(`\nReady to add ${toApply.length} paintings`);

  if (dryRun) return;

  const byAuthor = new Map();
  for (const { authorSlug, painting } of toApply) {
    if (!byAuthor.has(authorSlug)) byAuthor.set(authorSlug, []);
    byAuthor.get(authorSlug).push(painting);
  }

  for (const [slug, paintings] of byAuthor) {
    if (NEW_AUTHORS[slug]) {
      const author = { ...NEW_AUTHORS[slug].meta, paintings };
      await writeFile(path.join(authorsDir, `${slug}.json`), JSON.stringify(author, null, 2) + '\n');
      console.log(`Created ${slug} (${paintings.length})`);
      continue;
    }
    const file = path.join(authorsDir, `${slug}.json`);
    const author = JSON.parse(await readFile(file, 'utf8'));
    author.paintings.push(...paintings);
    await writeFile(file, JSON.stringify(author, null, 2) + '\n');
    console.log(`Updated ${slug} (+${paintings.length})`);
  }

  const indexPath = path.join(root, 'public', 'catalog', 'index.json');
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  for (const [categoryId, slugs] of Object.entries(INDEX_INSERTIONS)) {
    const category = index.categories.find((c) => c.id === categoryId);
    if (!category) throw new Error(`Missing category: ${categoryId}`);
    for (const slug of slugs) {
      if (NEW_AUTHORS[slug] && !category.authors.includes(slug)) category.authors.push(slug);
    }
  }
  await writeFile(indexPath, JSON.stringify(index, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
