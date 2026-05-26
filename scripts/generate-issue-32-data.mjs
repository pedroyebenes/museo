#!/usr/bin/env node
/**
 * Generate issue #32 catalog expansion data (~150 paintings).
 * Output: scripts/data/issue-32-paintings.json
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'scripts', 'data', 'issue-32-paintings.json');

function painting(id, filename, title, year, description, width, height) {
  return { id, filename, title, year, description, width, height };
}

const data = {
  additions: {
    rafael: [
      painting('rafael-alba-madonna', 'Raphael_-_The_Alba_Madonna_-_Google_Art_Project.jpg', 'La Madonna del alba', 1510, 'Tondo en el que la Virgen, el Niño y san Juan forman una pirámide de ternura sobre un fondo paisajístico. Rafael condensa su ideal de armonía clásica en una de las madonnas más equilibradas del Alto Renacimiento.', 94.5, 94.5),
      painting('rafael-madonna-cardellino', 'Raffaello_Sanzio_-_Madonna_del_Cardellino_-_Google_Art_Project.jpg', 'Madonna del cardellino', 1506, 'María entronizada sostiene al Niño mientras san Juan le ofrece un pinzón. La escena une devoción florentina y paisaje umbrio en una composición de claridad serena.', 107, 77),
      painting('rafael-transfiguracion', 'Raphael_-_The_Transfiguration_-_Google_Art_Project.jpg', 'La Transfiguración', 1520, 'Última gran obra de Rafael, alterna la gloria de Cristo transfigurado con el milagro del lunático poseso abajo. Resume la síntesis teológica y visual del artista en su madurez.', 405, 278),
      painting('rafael-bindo-altoviti', 'Raphael_-_Bindo_Altoviti_-_Google_Art_Project.jpg', 'Retrato de Bindo Altoviti', 1514, 'Joven banquero florentino posa con elegancia sobre fondo azul. Rafael combina la psicología del retrato con la suavidad veneciana del color en una obra de exquisita refinación.', 60, 44),
      painting('rafael-madonna-prado', 'Raphael_-_Madonna_in_the_Meadow_-_Google_Art_Project.jpg', 'Madonna del prado', 1506, 'La Virgen y el Niño en un prado con san Juan Bautista. Rafael equilibra ternura maternal y paisaje luminoso en una de sus madonnas más celebradas.', 113, 88),
    ],
    tiziano: [
      painting('tiziano-venus-espejo', 'Titian_-_Venus_with_a_Mirror_-_Google_Art_Project.jpg', 'Venus con espejo', 1555, 'La diosa contempla su imagen mientras Cupido sostiene el espejo. Tiziano explora la vanidad y la sensualidad tardía con pincelada rica y atmósfera dorada.', 124, 106),
      painting('tiziano-tributo-cesar', 'Titian_-_The_Tribute_Money_-_Google_Art_Project.jpg', 'El tributo de la moneda', 1516, 'Cristo señala la moneda del cesar ante los recaudadores en un paisaje abierto. Obra temprana que muestra la integración del color veneciano con la narrativa evangélica.', 75, 56),
      painting('tiziano-schiavona', "Titian_-_Portrait_of_a_Lady_('La_Schiavona')_-_Google_Art_Project.jpg", 'Retrato de dama (La Schiavona)', 1510, 'Mujer de perfil sobre fondo claro con brazo apoyado en un pretil. Tiziano inaugura el retrato veneciano moderno con dignidad clásica y presencia monumental.', 119, 97),
      painting('tiziano-bembo', 'Titian_–_Cardinal_Pietro_Bembo_–_Google_Art_Project.jpg', 'Retrato del cardenal Pietro Bembo', 1540, 'Humanista y cardenal veneciano posa con birreta roja sobre fondo oscuro. Tiziano retrata la cultura cortesana con sobriedad y profundidad psicológica.', 94, 77),
      painting('tiziano-venus-anadyomene', "Titian_(Tiziano_Vecellio)_-_Venus_Rising_from_the_Sea_('Venus_Anadyomene')_-_Google_Art_Project.jpg", 'Venus anadiómena', 1520, 'La diosa emerge del mar en un paisaje de cielo claro y figuras secundarias. Tiziano reinventa el desnudo clásico con color veneciano y movimiento sereno.', 76, 57),
    ],
    'miguel-angel': [
      painting('miguel-angel-tormento-san-antonio', 'Michelangelo_Buonarroti_-_The_Torment_of_Saint_Anthony_-_Google_Art_Project.jpg', 'El tormento de san Antonio Abad', 1487, 'Obra juvenil en la que demonios arrastran al eremita por los aires. Miguel Ángel demuestra ya su dominio del cuerpo en movimiento y del drama espiritual.', 47, 35),
      painting('miguel-angel-anunciacion', 'Michelangelo_Buonarroti_-_Annunciation_to_the_Virgin_-_Google_Art_Project.jpg', 'Anunciación a la Virgen', 1508, 'El ángel anuncia a María en un interior de arquitectura clásica. Panel temprano que anticipa la gravedad escultórica de su madurez florentina.', 115, 88),
    ],
    'peter-paul-rubens': [
      painting('rubens-abundancia', 'Peter_Paul_Rubens_-_Abundance_(Abundantia)_-_Google_Art_Project.jpg', 'La Abundancia', 1630, 'Figura femenina alegórica derrama frutos y flores en un paisaje fecundo. Rubens celebra la opulencia barroca con carnaciones luminosas y movimiento circular.', 131, 90),
      painting('rubens-daniel-leones', "Sir_Peter_Paul_Rubens_-_Daniel_in_the_Lions'_Den_-_Google_Art_Project.jpg", 'Daniel en el foso de los leones', 1615, 'El profeta ora impávido mientras los leones lo rodean en la penumbra. Rubens dramatiza la fe con claroscuro teatral y anatomías poderosas.', 224, 330),
      painting('rubens-jabali-calydon', 'Peter_Paul_Rubens_-_The_Calydonian_Boar_Hunt_-_Google_Art_Project.jpg', 'La caza del jabalí de Calidón', 1612, 'Héroes y amazonas caen sobre el jabalí en una espiral de cuerpos y lanza. Obra apoteósica del barroco flamenco que convierte el mito en espectáculo dinámico.', 248, 377),
      painting('rubens-venus-adonis', 'Peter_Paul_Rubens_-_Venus_and_Adonis_-_Google_Art_Project.jpg', 'Venus y Adonis', 1635, 'Venus intenta retener a Adonis antes de la caza fatal. Rubens funde erotismo mitológico y paisaje boscoso en una escena de despedida apasionada.', 198, 298),
      painting('rubens-bacanal', 'Peter_Paul_Rubens_-_Bacchanalia_-_Google_Art_Project.jpg', 'Bacanal', 1615, 'Sátiros y ninfas danzan en un bosque de celebración pagana. Rubens despliega su energía carnavalesca y su dominio del cuerpo en movimiento.', 214, 305),
      painting('rubens-marte-venus', 'Peter_Paul_Rubens_(Flemish)_-_The_Return_from_War-_Mars_Disarmed_by_Venus_-_Google_Art_Project.jpg', 'Marte desarmado por Venus', 1610, 'Venus desarma a Marte mientras amorcillos juegan con sus armas. Rubens alegoriza la paz amorosa con carnaciones sensuales y composición dinámica.', 203, 298),
    ],
    'diego-velazquez': [
      painting('velazquez-musicos', 'Diego_Velázquez_-_The_Three_Musicians_-_Google_Art_Project.jpg', 'Los músicos', 1618, 'Grupo de figuras con instrumentos en un interior sevillano de claroscuro. Obra temprana que muestra el naturalismo y la atención al detalle cotidiano del Velázquez juvenil.', 50, 42),
      painting('velazquez-infanta-azul', 'Diego_Rodriguez_de_Silva_y_Velázquez_-_Infanta_Margarita_Teresa_in_a_Blue_Dress_-_Google_Art_Project.jpg', 'Infanta Margarita Teresa en azul', 1659, 'Retrato de corte de la infanta con vestido azul y enagua blanca. Velázquez captura la presencia regia con pincelada suelta y economía cromática.', 127, 107),
      painting('velazquez-san-pablo', 'Diego_Velázquez_-_Saint_Paul_-_Google_Art_Project.jpg', 'San Pablo', 1619, 'El apóstol aparece en un interior modesto con espada y libros. Retrato devocional temprano donde la luz lateral modela la figura con sobriedad sevillana.', 102, 83),
      painting('velazquez-juan-mateos', 'Velázquez_-_Don_Juan_Mateos_(d.1643)_-_Google_Art_Project.jpg', 'Don Juan Mateos', 1632, 'Retrato ecuestre de un personaje de la corte con caballo y paisaje. Velázquez aplica su sobriedad aristocrática al retrato ecuestre antes de las meninas.', 133, 106),
    ],
    rembrandt: [
      painting('rembrandt-hijo-prodigo', 'Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg', 'El regreso del hijo pródigo', 1669, 'Padre e hijo arrodillados en un abrazo de perdón ante figuras secundarias. Una de las cumbres espirituales de Rembrandt, pintada con materia espesa y luz interior.', 262, 205),
      painting('rembrandt-rapto-europa', 'Rembrandt_-_The_Abduction_of_Europa_-_Google_Art_Project.jpg', 'El rapto de Europa', 1632, 'Zeus, transformado en toro, arrastra a Europa hacia el mar mientras sus acompañantes reaccionan. Rembrandt combina mitología clásica con paisaje tempestuoso y humor narrativo.', 64, 78),
      painting('rembrandt-lazaro', 'Rembrandt_Harmensz._van_Rijn_-_The_Raising_of_Lazarus_-_Google_Art_Project.jpg', 'La resurrección de Lázaro', 1630, 'Cristo ordena salir de la tumba a Lázaro envuelto en sudario. Escena nocturna de fe y milagro donde el claroscuro concentra la atención en el gesto salvador.', 142, 113),
      painting('rembrandt-jeremias', 'Rembrandt_Harmensz._van_Rijn_-_Jeremia_treurend_over_de_verwoesting_van_Jeruzalem_-_Google_Art_Project.jpg', 'Jeremías lamentando la destrucción de Jerusalén', 1630, 'El profeta contempla la ruina de la ciudad santa con gesto de duelo profundo. Rembrandt convierte la profecía bíblica en meditación sobre la pérdida histórica.', 58, 46),
    ],
    'pietro-perugino': [
      painting('perugino-francesco-opere', 'Perugino_-_Ritratto_di_Francesco_delle_Opere_-_Google_Art_Project.jpg', 'Retrato de Francesco delle Opere', 1494, 'Banquero florentino posa ante un paisaje apacible con manos entrelazadas. Perugino traduce la dignidad civil en un retrato de calma y precisión lineal.', 52, 44),
      painting('perugino-crucifixion', 'Pietro_Perugino_-_The_Crucifixion_-_Google_Art_Project.jpg', 'La Crucifixión', 1496, 'Cristo en la cruz flanqueado por santos y donantes en un paisaje umbrio. Perugino organiza la escena con la serenidad compositiva que influyó en el joven Rafael.', 185, 165),
    ],
    'rogier-van-der-weyden': [
      painting('rogier-crucifixion-triptico', 'Rogier_van_der_Weyden_-_Triptych-_The_Crucifixion_-_Google_Art_Project.jpg', 'Tríptico de la Crucifixión', 1445, 'Cristo muerto en la cruz entre la Virgen, san Juan y donantes arrodillados. Rogier condensa el dolor en figuras alargadas y color intenso sobre fondos dorados.', 101, 70),
      painting('rogier-pieta', 'Rogier_van_der_Weyden_-_Pietà_-_Google_Art_Project.jpg', 'Piedad', 1441, 'Cristo yacente sobre las rodillas de la Virgen en un paisaje rocoso. La escena transmite una intimidad dolorosa mediante gestos contenidos y rostros compungidos.', 34, 45),
      painting('rogier-altar-middelburg', 'Rogier_van_der_Weyden_-_The_Middelburg_Altar_-_Google_Art_Project.jpg', 'Retablo de Middelburg', 1450, 'Escenas de la Anunciación y la Visitación en un retablo gótico de gran refinamiento. Rogier articula la devoción mariana con arquitectura miniaturizada y color joya.', 160, 120),
      painting('rogier-virgen-nino', 'Rogier_van_der_Weyden_-_Virgin_and_Child_-_Google_Art_Project.jpg', 'Virgen y el Niño', 1450, 'María sostiene al Niño en un interior íntimo de gran ternura. Rogier condensa la devoción flamenca en figuras delicadas y color luminoso.', 32, 25),
    ],
    'pieter-bruegel-el-viejo': [
      painting('bruegel-proverbios', 'Pieter_Brueghel_the_Elder_-_The_Dutch_Proverbs_-_Google_Art_Project.jpg', 'Los proverbios flamencos', 1559, 'Aldea bulliciosa donde cada grupo ilustra un refrán popular. Bruegel convierte la moral colectiva en una crónica satírica de la condición humana.', 117, 163),
      painting('bruegel-caida-angeles', 'Pieter_Bruegel_the_Elder_-_The_Fall_of_the_Rebel_Angels_-_Google_Art_Project.jpg', 'La caída de los ángeles rebeldes', 1562, 'San Miguel expulsa a los ángeles caídos en un torbellino de criaturas híbridas. Bruegel mezcla iconografía bíblica y fantasía grotesca con detalle alucinante.', 117, 162),
      painting('bruegel-cosechadores', 'Pieter_Bruegel_the_Elder-_The_Harvesters_-_Google_Art_Project.jpg', 'Los cosechadores', 1565, 'Campesinos descansan y siegan bajo el sol de verano en una ladera dorada. Segunda escena de la serie de los meses, observa el trabajo rural con distancia moral y realismo.', 119, 162),
      painting('bruegel-pintor-comprador', 'Pieter_Bruegel_the_Elder_-_The_Painter_and_the_Buyer,_ca._1566_-_Google_Art_Project.jpg', 'El pintor y el comprador', 1566, 'Artista y cliente negocian ante un caballete en una escena satírica del mercado del arte. Bruegel ironiza sobre la relación entre creación y comercio.', 25, 21),
    ],
    'el-bosco': [
      painting('bosco-muerte-avaro', 'Hieronymus_Bosch_-_Death_and_the_Miser_-_Google_Art_Project.jpg', 'La muerte del avaro', 1490, 'Un moribundo elige entre un ángel y un demonio mientras la muerte entra por la ventana. Bosco advierte sobre la codicia con una escena claustrofóbica de gran simbolismo.', 93, 31),
      painting('bosco-escarnio-cristo', 'Hieronymus_Bosch_-_Christ_Mocked_(The_Crowning_with_Thorns)_-_Google_Art_Project.jpg', 'Escarnio de Cristo', 1510, 'Soldados corona de espinas a Cristo en un interior sombrío. Bosco intensifica el sufrimiento mediante rostros grotescos y una luz que aísla la figura redentora.', 73, 57),
      painting('bosco-ecce-homo', 'Hieronymus_Bosch_-_Ecce_Homo_-_Google_Art_Project.jpg', 'Ecce homo', 1475, 'Cristo presentado al pueblo entre soldados y donantes. Obra temprana donde Bosco ya muestra su gusto por figuras excéntricas y moralización implacable.', 75, 60),
      painting('bosco-pedlar', 'Jheronimus_Bosch_-_The_Pedlar_-_Google_Art_Project.jpg', 'El caminante', 1500, 'Hombre cargado con enseres avanza por un camino entre tentaciones y peligros. Bosco convierte la vida errante en alegoría moral de fragilidad humana.', 71, 25),
    ],
    'hans-holbein-el-joven': [
      painting('holbein-retrato-dama', 'Hans_Holbein_the_Younger_-_Portrait_of_a_Lady_-_Google_Art_Project.jpg', 'Retrato de una dama', 1520, 'Mujer anónima con tocado y joyas posa sobre fondo azul. Holbein combina precisión flamenca y elegancia cortesana en un retrato de sobria distinción.', 35, 26),
      painting('holbein-jane-seymour', 'Hans_Holbein_the_Younger_-_Jane_Seymour,_Queen_of_England_-_Google_Art_Project.jpg', 'Retrato de Jane Seymour', 1537, 'Tercera esposa de Enrique VIII posa con ricos bordados y expresión contenida. Holbein fija la imagen oficial de la reina Tudor con detalle casi miniaturístico.', 26, 19),
    ],
    'bartolome-esteban-murillo': [
      painting('murillo-adoracion-magos', 'Bartolomé_Esteban_Murillo_-_Adoration_of_the_Magi_-_Google_Art_Project.jpg', 'Adoración de los Magos', 1660, 'Los Reyes Magos adoran al Niño en un establo iluminado por luz celestial. Murillo une devoción barroca y ternura popular en una escena de calidez dorada.', 333, 224),
      painting('murillo-vendedora-flores', 'Murillo,_Bartolomé_Estéban_-_The_Flower_Girl_-_Google_Art_Project.jpg', 'La vendedora de flores', 1665, 'Niña ofrece un cesto de flores con mirada directa y sonrisa espontánea. Murillo eleva el retrato de calle a género poético de gran encanto sevillano.', 74, 61),
      painting('murillo-huida-egipto', 'Bartolomé_Esteban_Murillo_-_The_Flight_into_Egypt_-_Google_Art_Project.jpg', 'La huida a Egipto', 1650, 'La Sagrada Familia descansa en un paisaje nocturno mientras un ángel les guía. Murillo dramatiza el éxodo con luna, nubes y una intimidad protectora.', 134, 180),
      painting('murillo-magdalena', 'Bartolomé_Esteban_Murillo_-_La_Magdalena_-_Google_Art_Project.jpg', 'La Magdalena penitente', 1665, 'María Magdalena medita ante un crucifijo en un paisaje sombrío. Murillo une devoción contrarreformista y naturalismo sevillano en una figura de recogimiento.', 108, 85),
    ],
    'nicolas-poussin': [
      painting('poussin-imperio-flora', 'Nicolas_Poussin_-_The_Empire_of_Flora_-_Google_Art_Project.jpg', 'El imperio de Flora', 1631, 'Flora reina sobre un reino de flores, mitos y transformaciones vegetales. Poussin ordena la mitología clásica con geometría serena y color mineral.', 131, 181),
      painting('poussin-marte-venus', 'Nicolas_Poussin_-_Mars_and_Venus_-_Google_Art_Project_(559039).jpg', 'Marte y Venus', 1630, 'Los dioses del amor y la guerra descansan en un paisaje clásico. Poussin equilibra pasión y razón en una escena de elegancia neoclásica avant la lettre.', 155, 215),
      painting('poussin-adoracion-magos', 'Poussin,_Nicolas_-_The_Adoration_of_the_Magi_-_Google_Art_Project.jpg', 'La adoración de los Magos', 1633, 'Los Reyes Magos adoran al Niño en un paisaje clásico de ruinas y cielo sereno. Poussin narra la Epifanía con claridad racional y figuras escultóricas.', 120, 175),
    ],
    'jean-honore-fragonard': [
      painting('fragonard-gallina-ciega', "Jean-Honoré_Fragonard_-_Blind-Man's_Buff_-_Google_Art_Project.jpg", 'Gallina ciega', 1775, 'Jóvenes aristócratas juegan en un parque iluminado por la tarde. Fragonard captura el placer galante con pincelada vaporosa y vegetación exuberante.', 120, 195),
      painting('fragonard-invierno', 'Jean-Honoré_Fragonard_-_Winter_-_Google_Art_Project.jpg', 'El invierno', 1755, 'Figura femenina se abriga junto a un brasero en un interior íntimo. De la serie de las estaciones, traduce el frío en una escena de recogimiento doméstico.', 69, 93),
      painting('fragonard-pastores', 'Jean-Honoré_Fragonard_-_Landscape_with_Shepherds_and_Flock_of_Sheep_-_Google_Art_Project.jpg', 'Paisaje con pastores y rebaño', 1760, 'Pastores descansan junto a ovejas en un paisaje italiano idealizado. Fragonard demuestra su maestría paisajística más allá del rococó galante.', 74, 98),
      painting('fragonard-competicion', 'Jean-Honoré_Fragonard_-_The_Competition_-_Google_Art_Project.jpg', 'La competición', 1755, 'Jóvenes compiten en un jardín galante bajo la atenta mirada de cortesanos. Fragonard captura el espíritu lúdico del rococó con pincelada rápida y color brillante.', 115, 90),
    ],
    'artemisia-gentileschi': [
      painting('gentileschi-lautista', 'Artemisia_Gentileschi_-_Self-Portrait_as_a_Lute_Player_-_Google_Art_Project.jpg', 'Autorretrato como laúdista', 1616, 'La artista posa con laúd y vestido orientalizante en actitud de interpretación. Gentileschi se presenta como musa activa, no como mera modelo pasiva.', 77, 71),
      painting('gentileschi-danae', 'Artemisia_Gentileschi_-_Danae_-_Google_Art_Project.jpg', 'Danae', 1612, 'La princesa recibe la lluvia de oro de Zeus en su alcoba. Gentileschi aborda el mito clásico con sensualidad contenida y claroscuro caravaggesco.', 161, 130),
    ],
  },

  newAuthors: {
    giotto: {
      meta: {
        id: 'giotto',
        name: 'Giotto',
        category: 'renacimiento-manierismo',
        fullName: 'Giotto di Bondone',
        years: 'c. 1267 – 1337',
        origin: 'Vespignano, cerca de Florencia',
        bio: 'Precursor del Renacimiento italiano que humanizó la pintura medieval con volumen, expresividad y espacio creíble. Sus frescos en Padua, Assisi y Florencia establecieron un nuevo lenguaje visual emocional que influiría en generaciones posteriores.',
      },
      paintings: [
        painting('giotto-maesta', 'Giotto,_1267_Around-1337_-_Maestà_-_Google_Art_Project.jpg', 'Maestà', 1310, 'La Virgen entronizada rodeada de ángeles y santos en un trono monumental. Obra clave de Giotto que sustituye la rigidez gótica por figuras graves y arquitectura convincente.', 200, 320),
        painting('giotto-entierro-maria', 'Giotto_-_The_Entombment_of_Mary_-_Google_Art_Project.jpg', 'El entierro de María', 1310, 'Apóstoles rodean el lecho de la Virgen en una escena de duelo contenido. Giotto organiza el dolor colectivo con claridad narrativa y gestos elocuentes.', 75, 45),
        painting('giotto-polittico-badia', 'Giotto_-_Polittico_di_Badia_-_Google_Art_Project.jpg', 'Políptico de Badia', 1300, 'Retablo con la Virgen y santos en compartimentos arquitectónicos. Temprana obra florentina donde Giotto ya muestra su búsqueda de espacio y dignidad humana.', 91, 334),
        painting('giotto-lamentacion', 'Giotto_-_Saint_Francis_Receiving_the_Stigmata_-_Google_Art_Project.jpg', 'San Francisco recibiendo los estigmas', 1300, 'El santo recibe las heridas de Cristo en la montaña de La Verna. Giotto narra el misterio con claridad monumental y figuras de expresión contenida.', 314, 162),
        painting('giotto-crucifixion', 'Giotto_-_Crucifixion_-_Google_Art_Project.jpg', 'Crucifixión', 1305, 'Cristo expira en la cruz ante un grupo compacto de figuras y ángeles. Fragmento paduano donde Giotto humaniza el sacrificio con gestos contenidos y espacio creíble.', 90, 70),
      ],
    },
    'andrea-mantegna': {
      meta: {
        id: 'andrea-mantegna',
        name: 'Andrea Mantegna',
        category: 'renacimiento-manierismo',
        fullName: 'Andrea Mantegna',
        years: 'c. 1431 – 1506',
        origin: 'Isola di Carturo, cerca de Padua',
        bio: 'Pintor y grabador paduano formado en la arqueología clásica y la perspectiva científica. Sus frescos, retablos y obras como Los triunfos de César combinaron monumentalidad romana, precisión anatómica y un dramatismo que anticipó el manierismo.',
      },
      paintings: [
        painting('mantegna-san-sebastian', 'Andrea_Mantegna_-_St._Sebastian_-_Google_Art_Project.jpg', 'San Sebastián', 1480, 'El mártir clavado a una columna clásica recibe las flechas en un paisaje de ruinas. Mantegna fusiona erudición arqueológica y cuerpo escultórico en una escena de heroísmo sereno.', 68, 107),
        painting('mantegna-presentacion', 'Andrea_Mantegna_-_The_Presentation_-_Google_Art_Project.jpg', 'La Presentación en el Templo', 1460, 'Simón recibe al Niño Jesús en un interior de arquitectura clásica. Mantegna organiza la escena con perspectiva rigurosa y figuras de relieve casi escultórico.', 67, 86),
        painting('mantegna-retrato-hombre', 'Andrea_Mantegna_-_Portrait_of_a_Man_-_Google_Art_Project.jpg', 'Retrato de un hombre', 1470, 'Hombre de perfil sobre fondo claro con expresión severa. Mantegna aplica al retrato la precisión lineal y la dignidad clásica propias de su formación paduana.', 32, 28),
        painting('mantegna-redentor', 'Andrea_Mantegna_-_Christ_as_the_Suffering_Redeemer_-_Google_Art_Project.jpg', 'Cristo como Redentor sufriente', 1500, 'Cristo resucitado muestra sus heridas en un paisaje apocalíptico. Obra tardía de intensa devoción donde la anatomía clásica sirve a la meditación sobre el sacrificio.', 78, 65),
        painting('mantegna-virgen-nino', 'Andrea_Mantegna_-_The_Virgin_and_Child_-_Google_Art_Project.jpg', 'La Virgen y el Niño', 1490, 'María sostiene al Niño ante un paraje de rocas y cielo despejado. Mantegna equilibra ternura maternal y solidez monumental en una madonna de carácter escultórico.', 43, 32),
        painting('mantegna-triunfo-senadores', 'Andrea_Mantegna_-_Triumph_of_Senators_-_Google_Art_Project.jpg', 'Triunfo de los senadores', 1500, 'Figuras clásicas desfilan en un friso de arquitectura romana. Mantegna evoca la antigüedad con precisión arqueológica y relieve casi escultórico.', 68, 45),
      ],
    },
    giorgione: {
      meta: {
        id: 'giorgione',
        name: 'Giorgione',
        category: 'renacimiento-manierismo',
        fullName: 'Giorgio Barbarelli da Castelfranco',
        years: 'c. 1477 – 1510',
        origin: 'Castelfranco Veneto, República de Venecia',
        bio: 'Pintor veneciano de vida breve pero influencia decisiva. Giorgione sustituyó la narrativa explícita por atmósferas poéticas, paisajes melancólicos y figuras enigmáticas que abrieron camino a Tiziano y al paisaje moderno.',
      },
      paintings: [
        painting('giorgione-tres-filosofos', 'Giorgione_-_Three_Philosophers_-_Google_Art_Project.jpg', 'Los tres filósofos', 1509, 'Tres figuras dialogan ante un paisaje rocoso al atardecer. Giorgione convierte la escena erudita en meditación silenciosa sobre la naturaleza y el saber.', 123, 144),
        painting('giorgione-laura', 'Giorgione_-_Young_Woman_("Laura")_-_Google_Art_Project.jpg', 'Mujer joven (Laura)', 1506, 'Retrato femenino de perfil con manto rojo y mirada introspectiva. Una de las primeras obras venecianas que funden retrato y poesía en una presencia enigmática.', 41, 34),
        painting('giorgione-adoracion-reyes', 'Giorgione_-_The_Adoration_of_the_Kings_-_Google_Art_Project.jpg', 'La adoración de los Reyes', 1505, 'Los Magos adoran al Niño bajo ruinas clásicas y cielo tempestuoso. Giorgione dramatiza la Epifanía con color atmosférico y figuras integradas en el paisaje.', 91, 110),
        painting('giorgione-venus-durmiente', 'Giorgione_-_Sleeping_Venus_-_Google_Art_Project.jpg', 'Venus dormida', 1510, 'La diosa yace en un paisaje campestre bajo cielo crepuscular. Obra fundacional del desnudo paisajístico veneciano, completada tras la muerte del artista.', 108, 175),
        painting('giorgione-moses-fire', 'Giorgione_-_Mosè_alla_prova_del_fuoco_-_Google_Art_Project.jpg', 'La prueba de fuego de Moisés', 1505, 'Moisés atraviesa la prueba del fuego ante el faraón en un paisaje dramático. Giorgione narra el episodio bíblico con atmósfera enigmática y color veneciano.', 89, 72),
        painting('giorgione-castelfranco', 'Giorgione_-_Castelfranco_Madonna_-_Google_Art_Project.jpg', 'Madonna de Castelfranco', 1505, 'La Virgen entronizada con santos ante un paisaje apacible. Obra temprana que muestra la poesía atmosférica que hará célebre al maestro veneciano.', 200, 152),
      ],
    },
    correggio: {
      meta: {
        id: 'correggio',
        name: 'Correggio',
        category: 'renacimiento-manierismo',
        fullName: 'Antonio Allegri, llamado Correggio',
        years: 'c. 1489 – 1534',
        origin: 'Correggio, Ducado de Módena y Reggio',
        bio: 'Maestro del manierismo emiliano que revolucionó la pintura con luz diáfana, escorzos audaces y sensualidad clásica. Sus frescos en Parma y lienzos mitológicos influyeron en el Barroco y en artistas desde el Greco hasta Reni.',
      },
      paintings: [
        painting('correggio-noche-santa', 'Correggio_-_The_Holy_Night_-_Google_Art_Project.jpg', 'La noche santa', 1529, 'Pastores y ángeles contemplan al Niño iluminado por una luz sobrenatural. Correggio inventa una escena nocturna de intimidad radiante y movimiento circular.', 256, 188),
        painting('correggio-jupiter-io', 'Antonio_Allegri,_called_Correggio_-_Jupiter_and_Io_-_Google_Art_Project.jpg', 'Júpiter e Io', 1530, 'El dios, transformado en nube, abraza a la ninfa en un paisaje de atmósfera sensual. Correggio pinta el mito con ternura erótica y color de seda.', 164, 70),
        painting('correggio-leda-cisne', 'Correggio_-_Leda_and_the_Swan_-_Google_Art_Project.jpg', 'Leda y el cisne', 1531, 'Leda recibe a Zeus metamorfoseado en un paisaje campestre. Obra mitológica donde la suavidad carnal se funde con un naturalismo luminoso.', 152, 191),
        painting('correggio-venus-cupido', 'Correggio_-_Venus_and_Cupid_-_Google_Art_Project.jpg', 'Venus y Cupido', 1525, 'La diosa del amor juega con su hijo en un paisaje de nubes y luz. Correggio convierte la mitología en escena de gracia y movimiento ascendente.', 155, 91),
        painting('correggio-cabeza-cristo', 'Correggio_(Antonio_Allegri)_(Italian)_-_Head_of_Christ_-_Google_Art_Project.jpg', 'Cabeza de Cristo', 1525, 'Rostro de Cristo de mirada baja y expresión compungida. Estudio devocional de gran intimidad donde la luz modela la carne con suavidad casi imperceptible.', 28, 24),
      ],
    },
    parmigianino: {
      meta: {
        id: 'parmigianino',
        name: 'Parmigianino',
        category: 'renacimiento-manierismo',
        fullName: 'Girolamo Francesco Maria Mazzola',
        years: '1503 – 1540',
        origin: 'Parma, Ducado de Parma y Piacenza',
        bio: 'Genio del manierismo parmesano que alargó las formas, suavizó los contornos y buscó una elegancia artificial y refinada. Su Madonna de cuello largo es emblema de una estética que privilegia la gracia sobre la naturaleza.',
      },
      paintings: [
        painting('parmigianino-madonna-cuello-largo', 'Parmigianino_-_Madonna_dal_collo_lungo_-_Google_Art_Project.jpg', 'Madonna de cuello largo', 1535, 'Virgen de proporciones alargadas sostiene al Niño dormido ante columnas clásicas. Obra cumbre del manierismo que convierte la gracia en abstracción elegante.', 132, 216),
        painting('parmigianino-venus-cupido', 'Parmigianino_-_Venus_Disarming_Cupid_-_Google_Art_Project.jpg', 'Venus desarma a Cupido', 1535, 'La diosa quita las armas al dios del amor en un paisaje de ruinas. Parmigianino mezcla erotismo clásico y ironía con contornos sinuosos y color frío.', 135, 165),
        painting('parmigianino-amor-arco', 'Francesco_Mazzola,_called_Parmigianino_-_Bow-carving_Amor_-_Google_Art_Project.jpg', 'Cupido tallando su arco', 1535, 'El dios infantil fabrica su arma en un paisaje de atmósfera melancólica. Parmigianino explora la mitología con refinamiento y una belleza deliberadamente artificial.', 74, 58),
        painting('parmigianino-virgen-nino', 'Parmigianino_-_The_Madonna_and_Child_-_Google_Art_Project.jpg', 'La Virgen y el Niño', 1525, 'María y el Niño posan en un paisaje de colinas suaves y cielo claro. Obra temprana que anticipa la elegancia alargada de su madurez manierista.', 88, 70),
        painting('parmigianino-retrato-cybo', 'Parmigianino_-_Portrait_of_Lorenzo_Cybo_-_Google_Art_Project.jpg', 'Retrato de Lorenzo Cybo', 1525, 'Noble genovés posa con capa roja y expresión distante. Parmigianino aplica al retrato la misma elongación y frialdad aristocrática de sus composiciones religiosas.', 68, 52),
      ],
    },
    bronzino: {
      meta: {
        id: 'bronzino',
        name: 'Bronzino',
        category: 'renacimiento-manierismo',
        fullName: 'Agnolo di Cosimo, llamado Bronzino',
        years: '1503 – 1572',
        origin: 'Florencia, República de Florencia',
        bio: 'Pintor oficial de la corte medicea y discípulo de Pontormo. Bronzino perfeccionó un manierismo frío y pulido, de color porcelana y erudición alegórica, visible en sus retratos ducales y escenas mitológicas de precisión casi lapidaria.',
      },
      paintings: [
        painting('bronzino-eleonora', 'Bronzino_-_Eleonora_di_Toledo_col_figlio_Giovanni_-_Google_Art_Project.jpg', 'Leonor de Toledo con su hijo Giovanni', 1545, 'La duquesa posa con rios bordados junto a su hijo en un interior sobrio. Retrato de corte que fija la imagen del poder mediceo con distancia majestuosa.', 115, 96),
        painting('bronzino-mujer-nino', 'Agnolo_Bronzino_-_A_Young_Woman_and_Her_Little_Boy_-_Google_Art_Project.jpg', 'Joven mujer y su hijo', 1540, 'Madre e hijo posan con joyas y telas de color frío sobre fondo azul. Bronzino convierte el retrato familiar en emblema de linaje y refinamiento cortesano.', 100, 80),
        painting('bronzino-cosimo-orfeo', 'Agnolo_Bronzino_-_Portrait_of_Cosimo_I_de\'_Medici_as_Orpheus_-_Google_Art_Project.jpg', 'Cosimo I de Médici como Orfeo', 1537, 'El duque desnudo sostiene la lira en alusión al mito del poeta-músico. Retrato alegórico que une poder político y erudición clásica con frialdad intencionada.', 93, 67),
        painting('bronzino-depostion', 'Agnolo_Bronzino_-_The_Deposition_of_Christ_-_Google_Art_Project.jpg', 'El descendimiento de Cristo', 1561, 'Cristo es bajado de la cruz en una escena de figuras entrelazadas y color pálido. Bronzino aplica al tema sacro la precisión manierista y una emoción contenida.', 268, 173),
        painting('bronzino-cosimo-armadura', 'Agnolo_Bronzino_-_Cosimo_I_de\'_Medici_in_armour_-_Google_Art_Project.jpg', 'Cosimo I de Médici con armadura', 1543, 'El duque aparece en armadura sobre fondo rojo con emblemas imperiales. Retrato de estado que combina propaganda dinástica y elegancia pictórica impecable.', 74, 58),
      ],
    },
    'andrea-del-sarto': {
      meta: {
        id: 'andrea-del-sarto',
        name: 'Andrea del Sarto',
        category: 'renacimiento-manierismo',
        fullName: 'Andrea d\'Agnolo di Francesco di Luca',
        years: '1486 – 1530',
        origin: 'Florencia, República de Florencia',
        bio: 'Pintor florentino apodado «el pintor sin errores» por su técnica impecable y color armonioso. Entre Rafael y el manierismo, Andrea del Sarto combinó naturalidad, devoción y un dominio del dibujo que influyó en su círculo, incluida su esposa Lucrezia y Pontormo.',
      },
      paintings: [
        painting('andrea-del-sarto-madonna-arpie', 'Andrea_del_Sarto_-_Madonna_delle_Arpie_-_Google_Art_Project.jpg', 'Madonna de las arpías', 1517, 'La Virgen entronizada con santos sobre un pedestal decorado con harpías. Obra cumbre de Andrea del Sarto que equilibra monumentalidad clásica y ternura humana.', 208, 178),
        painting('andrea-del-sarto-tobias', 'Andrea_del_Sarto_-_The_Archangel_Raphael_with_Tobias,_St._Leonard_and_the_Donor,_Leonardo_di_Lorenzo_Morelli_-_Google_Art_Project.jpg', 'El arcángel Rafael con Tobías', 1512, 'Rafael guía a Tobías mientras el donante observa la escena. Andrea del Sarto organiza el retablo con claridad narrativa y color florentino sereno.', 85, 178),
        painting('andrea-del-sarto-retrato-hombre', 'Andrea_del_Sarto_-_Portrait_of_a_Man_-_Google_Art_Project.jpg', 'Retrato de un hombre', 1517, 'Hombre maduro posa con expresión grave y ropas oscuras. Andrea del Sarto aplica al retrato la misma precisión técnica y sobriedad de sus composiciones religiosas.', 72, 57),
        painting('andrea-del-sarto-sacra-familia', 'Andrea_del_Sarto_-_Holy_Family_with_the_Infant_St_John_-_Google_Art_Project.jpg', 'Sagrada Familia con san Juan', 1520, 'María, José, el Niño y el joven san Juan forman un grupo íntimo en un paisaje apacible. Obra que muestra el naturalismo sereno del pintor florentino.', 120, 95),
        painting('andrea-del-sarto-anunciacion', 'Andrea_del_Sarto_-_Annunciation_-_Google_Art_Project.jpg', 'La Anunciación', 1512, 'Gabriel anuncia a María en un interior de arquitectura clásica. La escena fluye con naturalidad y una luz suave que anticipa la serenidad de su madurez.', 180, 158),
        painting('andrea-del-sarto-caridad', 'Andrea_del_Sarto_-_Charity_-_Google_Art_Project.jpg', 'La Caridad', 1530, 'Figura femenina alimenta a niños en un paisaje claro. Alegoría de las virtudes teologales pintada con la suavidad y el naturalismo de su última etapa.', 117, 92),
      ],
    },
    'lucas-cranach-el-viejo': {
      meta: {
        id: 'lucas-cranach-el-viejo',
        name: 'Lucas Cranach el Viejo',
        category: 'renacimiento-manierismo',
        fullName: 'Lucas Cranach der Ältere',
        years: '1472 – 1553',
        origin: 'Kronach, Franconia (Sacro Imperio Romano)',
        bio: 'Pintor y grabador de la corte de Wittenberg, amigo de Lutero y testigo visual de la Reforma. Cranach combinó elegancia gótica y erotismo clásico en retratos ducales, paisajes de bosque y mitologías de contornos sinuosos y color frío.',
      },
      paintings: [
        painting('cranach-jardin-eden', 'Lucas_Cranach_the_Elder_-_The_Garden_of_Eden_-_Google_Art_Project.jpg', 'El jardín del Edén', 1530, 'Adán y Eva en un paraíso de animales y árboles exuberantes. Cranach pinta la creación con detalle miniaturístico y una sensualidad contenida típica del Renacimiento nórdico.', 82, 114),
        painting('cranach-apolo-diana', 'Lucas_Cranach_the_Elder_-_Apollo_and_Diana_-_Google_Art_Project.jpg', 'Apolo y Diana', 1520, 'Los dioses gemelos posan en un bosque de ciervos y paisaje azul. Cranach traduce la mitología clásica con elegancia cortesana y fondos de bosque germánico.', 59, 45),
        painting('cranach-edad-oro', 'Lucas_Cranach_the_Elder_-_The_Golden_Age_-_Google_Art_Project.jpg', 'La Edad de Oro', 1530, 'Humanos viven en armonía con la naturaleza antes de la caída. Alegoría de plenitud primitiva pintada con el paisaje idealizado y la paleta fría del artista.', 75, 55),
        painting('cranach-juicio-paris', 'Lucas_Cranach_the_Elder_-_The_Judgement_of_Paris_-_Google_Art_Project.jpg', 'El juicio de Paris', 1528, 'Paris elige entre Juno, Minerva y Venus en un paisaje boscoso. Cranach convierte el mito en escena galante de color brillante y figuras esbeltas.', 71, 102),
        painting('cranach-corte-venus', 'Lucas_Cranach_the_Elder_-_The_Court_of_Venus_-_Google_Art_Project.jpg', 'La corte de Venus', 1518, 'Venus entronizada recibe a cortesanos y amorcillos en un paisaje de bosque. Cranach mezcla mitología clásica y erotismo cortesano con elegancia nórdica.', 81, 54),
        painting('cranach-venus-cupido', 'Lucas_Cranach_the_Elder_-_Venus_and_Cupid_-_Google_Art_Project.jpg', 'Venus y Cupido', 1525, 'Venus desnuda sostiene a Cupido bajo un dosel de seda. Cranach repite el tema mitológico con erotismo refinado y contornos alargados de estilo manierista nórdico.', 87, 57),
      ],
    },
    'claude-lorrain': {
      meta: {
        id: 'claude-lorrain',
        name: 'Claude Lorrain',
        category: 'barroco',
        fullName: 'Claude Gellée, llamado Le Lorrain',
        years: 'c. 1600 – 1682',
        origin: 'Chamagne, Ducado de Lorena',
        bio: 'Pintor frances afincado en Roma, creador del paisaje clásico ideal. Claude organizó la naturaleza según la luz dorada del amanecer y el ocaso, influyendo en el vedutismo, el romanticismo y la percepción europea del paisaje como espacio contemplativo.',
      },
      paintings: [
        painting('claude-puerto-clasico', 'Claude_-_Classical_Seaport_at_Sunset_-_Google_Art_Project.jpg', 'Puerto clásico al atardecer', 1644, 'Embarcaciones y arquitectura antigua se recortan contra un sol poniente. Claude convierte el puerto mediterráneo en escena de paz clásica bañada por luz dorada.', 103, 137),
        painting('claude-columna-paisaje', 'Claude_-_Landscape_with_a_Column_and_Figures_-_Google_Art_Project.jpg', 'Paisaje con columna y figuras', 1645, 'Pastores descansan junto a una columna clásica en un valle iluminado. Obra típica donde la arquitectura antigua ordena el paisaje ideal.', 103, 137),
        painting('claude-pastores', 'Claude_Lorrain_-_Landscape_with_Shepherds_-_Google_Art_Project.jpg', 'Paisaje con pastores', 1630, 'Pastores y rebaño descansan en un valle de árboles altos y cielo claro. Obra temprana que muestra la búsqueda de Claude por la armonía entre figura y naturaleza.', 97, 130),
        painting('claude-embarque-sheba', 'Claude_Lorrain_-_The_Embarkation_of_the_Queen_of_Sheba_-_Google_Art_Project.jpg', 'El embarque de la reina de Saba', 1648, 'La reina parte hacia Jerusalén en un puerto de arquitectura clásica. Claude narra el episodio bíblico como ceremonia luminosa junto al mar.', 149, 196),
        painting('claude-ursula', 'Claude_Lorrain_-_Seaport_with_the_Embarkation_of_Saint_Ursula_-_Google_Art_Project.jpg', 'Puerto con el embarque de santa Úrsula', 1641, 'Santa Úrsula y sus doncellas zarpan en un puerto bañado por la luz matinal. Paisaje histórico donde la atmósfera prevalece sobre la acción.', 113, 149),
      ],
    },
    'georges-de-la-tour': {
      meta: {
        id: 'georges-de-la-tour',
        name: 'Georges de La Tour',
        category: 'barroco',
        fullName: 'Georges de La Tour',
        years: '1593 – 1652',
        origin: 'Vic-sur-Seille, Ducado de Lorena',
        bio: 'Pintor lorrain de luz nocturna y devoción silenciosa. Georges de La Tour desarrolló un claroscuro extremo donde una sola fuente de luz —vela o linterna— revela figuras contemplativas de gran sobriedad, emparentadas con Caravaggio pero de calma mística propia.',
      },
      paintings: [
        painting('la-tour-tramposo', 'Georges_de_La_Tour_-_The_Cheat_with_the_Ace_of_Clubs_-_Google_Art_Project.jpg', 'El tramposo con el as de trébol', 1635, 'Jugadores de cartas engañan a un joven mientras una criada observa. La Tour dramatiza el engaño con luz de vela y gestos contenidos de gran tensión psicológica.', 106, 146),
        painting('la-tour-magdalena', 'Georges_de_La_Tour_-_Magdalene_with_the_Smoking_Flame_-_Google_Art_Project.jpg', 'Magdalena con la llama humeante', 1640, 'Magdalena medita ante un cráneo y una vela que se apaga. Obra nocturna de recogimiento espiritual donde la luz define la materia con minimalismo casi abstracto.', 128, 94),
        painting('la-tour-nino-nuevo', 'Georges_de_La_Tour_-_The_Newborn_Child_-_Google_Art_Project.jpg', 'El recién nacido', 1645, 'Madre e hija contemplan al bebé a la luz de una vela. Escena íntima de maternidad donde La Tour convierte lo doméstico en devoción silenciosa.', 76, 91),
        painting('la-tour-joseph-carpintero', 'Georges_de_La_Tour_-_Saint_Joseph_the_Carpenter_-_Google_Art_Project.jpg', 'San José carpintero', 1645, 'José trabaja la madera mientras el Niño sostiene una vela. La escena une trabajo manual y misterio cristiano en un claroscuro de gran serenidad.', 137, 101),
        painting('la-tour-educacion-maria', 'Georges_de_La_Tour_-_The_Education_of_the_Virgin_-_Google_Art_Project.jpg', 'La educación de la Virgen', 1640, 'Santa Ana enseña a leer a la joven María a la luz de una vela. La Tour convierte la escena doméstica en meditación silenciosa de gran intimidad.', 165, 130),
        painting('la-tour-job', 'Georges_de_La_Tour_-_Job_-_Google_Art_Project.jpg', 'Job', 1650, 'El patriarca sufriente medita en la penumbra junto a su esposa. La Tour reduce la escena bíblica a figuras esenciales iluminadas por una luz interior.', 145, 110),
      ],
    },
    'jusepe-de-ribera': {
      meta: {
        id: 'jusepe-de-ribera',
        name: 'Jusepe de Ribera',
        category: 'barroco',
        fullName: 'José de Ribera, llamado Lo Spagnoletto',
        years: '1591 – 1652',
        origin: 'Játiva, Reino de Valencia',
        bio: 'Pintor valenciano formado en la estela caravaggesca y afincado en Nápoles. Ribera combinó naturalismo crudo, tenebrismo y una anatomía implacable en escenas de mártires, filósofos y mendigos que lo convirtieron en maestro del barroco español e italiano.',
      },
      paintings: [
        painting('ribera-apolo-marsias', 'Jusepe_de_Ribera_-_Apollo_and_Marsyas_-_Google_Art_Project.jpg', 'Apolo y Marsias', 1637, 'Apolo desolla al sátiro vencido en un concurso musical. Ribera dramatiza el castigo mitológico con anatomía cruda y claroscuro violento.', 182, 232),
        painting('ribera-martirio-filipo', 'Jusepe_de_Ribera_-_The_Martyrdom_of_Saint_Philip_-_Google_Art_Project.jpg', 'El martirio de san Felipe', 1639, 'El apóstol es elevado en la cruz mientras figuras observan desde abajo. Escena de heroísmo cristiano pintada con realismo físico y luz lateral intensa.', 234, 203),
        painting('ribera-pie-bot', 'Jusepe_de_Ribera_-_The_Clubfoot_-_Google_Art_Project.jpg', 'El patizambo', 1642, 'Joven mendigo sonríe mientras muestra su documento de pobreza. Ribera dignifica la marginación con retrato directo y ternura inesperada.', 164, 94),
        painting('ribera-democrito', 'Jusepe_de_Ribera_-_Democritus_-_Google_Art_Project.jpg', 'Demócrito', 1630, 'El filósofo sonríe ante la vanidad del mundo con un cráneo en las manos. Ribera retrata la sabiduría cínica con naturalismo crudo y luz lateral intensa.', 125, 100),
        painting('ribera-santa-teresa', 'Jusepe_de_Ribera_-_Saint_Teresa_of_Avila_-_Google_Art_Project.jpg', 'Santa Teresa de Ávila', 1640, 'La mística carmelita recibe la visión con rostro extático y manos unidas. Ribera une devoción española y naturalismo napolitano en un retrato de gran intensidad.', 80, 65),
        painting('ribera-jacob', 'Jusepe_de_Ribera_-_Jacob\'s_Dream_-_Google_Art_Project.jpg', 'El sueño de Jacob', 1639, 'Jacob descansa mientras ángeles suben y bajan por la escala celestial. Ribera dramatiza la visión bíblica con claroscuro nocturno y anatomía robusta.', 179, 233),
      ],
    },
    'guido-reni': {
      meta: {
        id: 'guido-reni',
        name: 'Guido Reni',
        category: 'barroco',
        fullName: 'Guido Reni',
        years: '1575 – 1642',
        origin: 'Bolonia, Estados Pontificios',
        bio: 'Maestro del barroco clasicista boloñés, discípulo de los Carracci. Guido Reni suavizó el dramatismo caravaggesco en favor de una belleza ideal, pincelada ligera y devoción luminosa que lo convirtió en uno de los pintores más admirados de la Europa católica.',
      },
      paintings: [
        painting('reni-rapto-europa', 'Guido_Reni_-_The_Rape_of_Europa_-_Google_Art_Project.jpg', 'El rapto de Europa', 1637, 'Europa monta al toro de Zeus en un paisaje de nubes y mar. Reni pinta el mito con gracia clásica y color azul plateado de gran refinamiento.', 125, 100),
        painting('reni-atalanta', 'Guido_Reni_-_Atalanta_and_Hippomenes_-_Google_Art_Project.jpg', 'Atalanta e Hipómenes', 1625, 'Hipómenes arroja las manzanas de oro durante la carrera con Atalanta. Reni convierte la escena mitológica en danza de cuerpos idealizados y movimiento suave.', 206, 297),
        painting('reni-polifemo', 'Guido_Reni_-_Polyphemus_-_Google_Art_Project.jpg', 'Polifemo', 1639, 'El ciclope cantarino aparece en un paisaje clásico con expresión melancólica. Reni humaniza al monstruo mitológico con belleza clasicista y color sobrio.', 68, 53),
        painting('reni-susana', 'Guido_Reni_-_Susanna_and_the_Elders_-_Google_Art_Project.jpg', 'Susana y los viejos', 1622, 'Susana rechaza a los ancianos que la acosan en el baño. Reni aborda el tema con sensibilidad clasicista y una figura femenina de belleza ideal.', 145, 120),
        painting('reni-baptism', 'Guido_Reni_-_The_Baptism_of_Christ_-_Google_Art_Project.jpg', 'El bautismo de Cristo', 1623, 'Cristo recibe el bautismo de san Juan ante un cielo abierto con ángeles. Reni pinta el misterio con color claro y composición de elegancia devocional.', 260, 170),
      ],
    },
    'giovanni-battista-tiepolo': {
      meta: {
        id: 'giovanni-battista-tiepolo',
        name: 'Giovanni Battista Tiepolo',
        category: 'barroco',
        fullName: 'Giovanni Battista Tiepolo',
        years: '1696 – 1770',
        origin: 'Venecia, República de Venecia',
        bio: 'Último gran maestro del Settecento veneciano. Tiepolo cubrió palacios y iglesias de frescos aéreos donde la arquitectura se abre al cielo y figuras mitológicas y alegóricas flotan en una luz dorada de teatralidad barroca tardía.',
      },
      paintings: [
        painting('tiepolo-rosario', 'Giovanni_Battista_Tiepolo_-_The_Institution_of_the_Rosary_-_Google_Art_Project.jpg', 'La institución del Rosario', 1739, 'La Virgen entrega el rosario a santo Domingo entre nubes de ángeles. Tiepolo despliega su frescura cromática y composiciones abiertas al cielo.', 520, 450),
        painting('tiepolo-moises', 'Giovanni_Battista_Tiepolo_-_The_Finding_of_Moses_-_Google_Art_Project.jpg', 'El hallazgo de Moisés', 1740, 'La hija del faraón descubre al infante en la cesta entre el Nilo y la arquitectura clásica. Tiepolo narra el episodio con elegancia teatral y color veneciano.', 135, 120),
        painting('tiepolo-banquete-cleopatra', 'Giovanni_Battista_Tiepolo_-_The_Banquet_of_Cleopatra_-_Google_Art_Project.jpg', 'El banquete de Cleopatra', 1744, 'Cleopatra disuelve una perla en vinagre ante Antonio. Escena de opulencia orientalisante pintada con pincelada ligera y humor narrativo.', 250, 300),
        painting('tiepolo-apolo-dafne', 'Giovanni_Battista_Tiepolo_-_Apollo_and_Daphne_-_Google_Art_Project.jpg', 'Apolo y Dafne', 1755, 'Apolo persigue a la ninfa que comienza su transformación en laurel. Tiepolo captura el instante del mito con arabescos de color y figuras etéreas.', 96, 79),
        painting('tiepolo-inmaculada', 'Giovanni_Battista_Tiepolo_-_The_Immaculate_Conception_-_Google_Art_Project.jpg', 'La Inmaculada Concepción', 1767, 'María se eleva entre nubes y símbolos marianos en un cielo de azul pálido. Obra tardía de devoción luminosa y movimiento ascendente.', 400, 200),
      ],
    },
    canaletto: {
      meta: {
        id: 'canaletto',
        name: 'Canaletto',
        category: 'barroco',
        fullName: 'Giovanni Antonio Canal, llamado Canaletto',
        years: '1697 – 1768',
        origin: 'Venecia, República de Venecia',
        bio: 'Maestro del vedutismo veneciano que documentó con precisión topográfica y luz cristalina los canales, plazas y ceremonias de la Serenísima. Sus vistas fueron codiciadas por el gran tour británico y definieron la imagen romántica de Venecia.',
      },
      paintings: [
        painting('canaletto-entrada-gran-canal', 'Canaletto_-_The_Entrance_to_the_Grand_Canal,_Venice_-_Google_Art_Project.jpg', 'La entrada al Gran Canal', 1730, 'Góndolas y palacios se alinean en la desembocadura del canal mayor. Canaletto combina precisión arquitectónica y atmósfera luminosa en una veduta emblemática.', 118, 76),
        painting('canaletto-riva-schiavoni', 'Giovanni_Antonio_Canal,_called_Canaletto_-_View_of_the_Riva_degli_Schiavoni,_Venice_-_Google_Art_Project.jpg', 'La Riva degli Schiavoni', 1730, 'Vista panorámica del muelle veneciano con barcos y figuras diminutas. Canaletto registra la vida urbana con claridad casi cartográfica y cielo sereno.', 165, 100),
        painting('canaletto-thames', 'Canaletto_-_London-_The_Thames_from_Somerset_House_Terrace_towards_the_City_-_Google_Art_Project.jpg', 'El Támesis desde Somerset House', 1750, 'Vista londinense con el río, la ciudad y el cielo abierto. Durante su estancia inglesa, Canaletto aplicó su vedutismo veneciano a la metrópolis británica.', 118, 76),
        painting('canaletto-patio-canteros', "Canaletto_-_The_Stone_Mason's_Yard_-_Google_Art_Project.jpg", 'El patio de los canteros', 1725, 'Obreros trabajan junto al canal en una Venecia cotidiana y soleada. Veduta temprana donde la precisión topográfica convive con escenas de vida laboral.', 124, 163),
        painting('canaletto-san-marco', 'Canaletto_-_The_Piazza_San_Marco,_Venice_-_Google_Art_Project.jpg', 'La plaza de San Marcos', 1730, 'La plaza y la basílica se despliegan bajo un cielo limpio con figuras paseando. Canaletto fija la imagen icónica de Venecia con luz diáfana y perspectiva rigurosa.', 144, 192),
        painting('canaletto-dolo', 'Canaletto_-_The_Grand_Canal_at_the_Church_of_the_Madonna_della_Salute_-_Google_Art_Project.jpg', 'El Gran Canal con la Salute', 1730, 'La iglesia barroca se alza al final del canal bajo un cielo sereno. Veduta clásica que combina precisión topográfica y atmósfera luminosa veneciana.', 151, 121),
      ],
    },
    'anthony-van-dyck': {
      meta: {
        id: 'anthony-van-dyck',
        name: 'Anthony van Dyck',
        category: 'barroco',
        fullName: 'Sir Anthony van Dyck',
        years: '1599 – 1641',
        origin: 'Amberes, Condado de Flandes',
        bio: 'Retratista de la corte inglesa y principal discípulo de Rubens. Van Dyck definió la elegancia aristocrática del siglo XVII con figuras alargadas, telas fluidas y una distancia distinguida que convirtió el retrato en instrumento de poder y refinamiento.',
      },
      paintings: [
        painting('van-dyck-carlos-caza', 'Sir_Anthony_Van_Dyck_-_Charles_I_(1600-49)_-_Google_Art_Project.jpg', 'Carlos I de Inglaterra', 1635, 'El monarca posa con elegancia sobre fondo paisajístico en uno de sus retratos más emblemáticos. Van Dyck define la imagen regia del Stuart con distancia distinguida.', 84, 104),
        painting('van-dyck-autorretrato', 'Anthony_van_Dyck_-_Self-Portrait_-_Google_Art_Project.jpg', 'Autorretrato', 1621, 'El artista joven se representa con barba y giro de cabeza confiado. Autorretrato temprano que anticipa la elegancia distante de su madurez cortesana.', 73, 57),
        painting('van-dyck-girasol', 'Anthony_van_Dyck_-_Portrait_of_the_Artist_with_Sunflower_-_Google_Art_Project.jpg', 'Autorretrato con girasol', 1632, 'Van Dyck posa junto a un girasol en alusión a la fama y la veneración artística. Retrato alegórico de gran sophistication flamenca.', 73, 61),
        painting('van-dyck-isabela', 'Anthony_van_Dyck_-_Portrait_of_Queen_Henrietta_Maria_-_Google_Art_Project.jpg', 'Retrato de la reina Enriqueta María', 1635, 'La reina consorte inglesa posa con elegancia y mirada distante. Van Dyck define el retrato cortesano femenino con telas fluidas y color sobrio.', 106, 86),
        painting('van-dyck-jabach', 'Anthony_van_Dyck_-_Portrait_of_a_Man,_probably_Everhard_Jabach_-_Google_Art_Project.jpg', 'Retrato de Everhard Jabach', 1634, 'El coleccionista alemán posa entre obras de arte y telas ricas. Van Dyck retrata al mecenas ilustrado con la elegancia que definió la élite europea del Seicento.', 140, 118),
      ],
    },
  },

  indexInsertions: {
    'renacimiento-manierismo': [
      'giotto',
      'andrea-mantegna',
      'giorgione',
      'correggio',
      'parmigianino',
      'bronzino',
      'andrea-del-sarto',
      'lucas-cranach-el-viejo',
    ],
    barroco: [
      'jusepe-de-ribera',
      'guido-reni',
      'anthony-van-dyck',
      'claude-lorrain',
      'georges-de-la-tour',
      'giovanni-battista-tiepolo',
      'canaletto',
    ],
  },
};

// Count summary
let addCount = 0;
for (const arr of Object.values(data.additions)) addCount += arr.length;
let newCount = 0;
for (const a of Object.values(data.newAuthors)) newCount += a.paintings.length;
console.error(`additions: ${addCount}, newAuthors: ${newCount}, total: ${addCount + newCount}`);

await writeFile(outPath, JSON.stringify(data, null, 2) + '\n');
console.error(`Written ${outPath}`);
