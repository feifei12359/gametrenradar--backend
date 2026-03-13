export class NewWordResponseDto {
  id!: string;
  keyword!: string;
  source!: string | null;
  firstSeenAt!: Date;
  score!: number;
  region!: string | null;
  status!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
