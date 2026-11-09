import { publishedProjectIds } from "./publishedProjects";

export type StudentGroup = "9A" | "9C";

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  group: StudentGroup;
  artwork: number;
  published: boolean;
};

// Transcribed from the two roster PDFs. Their listing order is temporary:
// it does not represent ranking or priority. Review spelling and consent
// before publishing names of minors on the public internet.
const roster: Record<StudentGroup, Array<[string, string]>> = {
  "9A": [
    ["Leandro", "Acuña Puente"],
    ["Sofia Sabrina", "Alfaro Farre"],
    ["Santiago Benjamín", "Armanetti Ruggiero"],
    ["Ivo Nicolas", "Bentancor Carpelino"],
    ["Joaquin", "Cabovianco Turra"],
    ["Juan Benjamín", "Cámara Ramos"],
    ["Máximo", "Cano Flesas"],
    ["Juan Ignacio", "Castiglioni Ferreira"],
    ["Bautista", "Di Palma Mesa"],
    ["Renato", "Etcheverrito Perez"],
    ["Ana Paula", "Fantoni Montero"],
    ["Joaquín", "Jaurena Barboza"],
    ["Nicolas", "Leguizamon Mota"],
    ["Macarena", "López Tardi"],
    ["Catalina", "Martin Lain"],
    ["Giuliana", "Martínez González"],
    ["Camila", "Mendoza Mori"],
    ["Agustin", "Podesta Di Lorenzo"],
    ["Mikaela Martina", "Rocha Paz"],
    ["Juan Francisco", "Rojo Ferraro"],
    ["Benjamin", "Roman Aboal"],
    ["Gerónimo", "Suárez Marchetti"],
    ["Juan Ignacio", "Gimenez Piriz"],
    ["Lara Federica", "Viana Ferrao"],
    ["Ivan", "Villar Diaz"],
  ],
  "9C": [
    ["Pedro", "Abal Cabrera"],
    ["Delfina", "Acevedo Regueira"],
    ["Facundo Nicolas", "Bonifacino Azziorri"],
    ["Clara Etelvina", "Ceriani Chiodi"],
    ["Alejo", "Cibils Abreu"],
    ["Juan Pedro", "Corporales Oviedo"],
    ["Juan Cruz", "Di Palma Mesa"],
    ["Sofía Belén", "Esquivel Silva"],
    ["Enzo Sebastian", "Ferreira Correa"],
    ["Bautista", "Gomendio Castelli"],
    ["Felipe", "González Hernández"],
    ["Luca", "Laurito Barreto"],
    ["Rocio Juliana", "Lopez de Lacalle Garelli"],
    ["Benjamin", "Martinez Quinteiro"],
    ["Sofía", "Méndez Sbrocca"],
    ["Santiago German", "Mieres Teliz"],
    ["Evangelina", "Paiva García"],
    ["Felipe", "Pose Cambon"],
    ["Sofía Inés", "Reina Losno"],
    ["Bautista Sebastián", "Rodriguez Mesa"],
    ["Felipe", "Vera Nuñez"],
    ["Nicolas", "Barros Villasantes"],
  ],
};

const slugify = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const createGroup = (group: StudentGroup): Student[] =>
  roster[group].map(([firstName, lastName], index) => ({
    id: `${group.toLowerCase()}-${slugify(`${firstName}-${lastName}`)}`,
    firstName,
    lastName,
    group,
    // Eight visual families; independent of academic performance.
    artwork: (index * 7 + (group === "9A" ? 0 : 3)) % 8,
    published: publishedProjectIds.has(`${group.toLowerCase()}-${slugify(`${firstName}-${lastName}`)}`),
  }));

const groupA = createGroup("9A");
const groupC = createGroup("9C");

// Temporarily interleave both groups without ranking either one.
export const students: Student[] = Array.from({ length: Math.max(groupA.length, groupC.length) })
  .flatMap((_, index) => [groupA[index], groupC[index]].filter((student): student is Student => Boolean(student)));

export function findStudent(id: string): Student | undefined {
  return students.find((student) => student.id === id);
}

export function searchKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es").trim();
}
