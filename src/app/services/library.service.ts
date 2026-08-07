import { Injectable } from '@angular/core';
import exercisesData from '../../assets/data/exercises.json';
import { Exercise, ExerciseCategory } from '../models';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly exercises = exercisesData as Exercise[];
  private readonly categories = Array.from(new Set(this.exercises.map((exercise) => exercise.category))).sort((left, right) => left.localeCompare(right));

  getAll(): Exercise[] {
    return this.exercises;
  }

  getCategories(): ExerciseCategory[] {
    return this.categories;
  }

  findById(id: string): Exercise | undefined {
    return this.exercises.find((item) => item.id === id);
  }

  filter(query: string, category: 'all' | ExerciseCategory, level: 'all' | Exercise['level']): Exercise[] {
    const normalized = query.trim().toLowerCase();

    return this.exercises.filter((exercise) => {
      const categoryMatch = category === 'all' || exercise.category === category;
      const levelMatch = level === 'all' || exercise.level === level;
      const queryMatch =
        normalized.length === 0 ||
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.description.toLowerCase().includes(normalized) ||
        exercise.category.toLowerCase().includes(normalized) ||
        exercise.apparatus.toLowerCase().includes(normalized) ||
        exercise.focusAreas.some((area) => area.toLowerCase().includes(normalized)) ||
        exercise.cueTags.some((tag) => tag.toLowerCase().includes(normalized));

      return categoryMatch && levelMatch && queryMatch;
    });
  }
}
