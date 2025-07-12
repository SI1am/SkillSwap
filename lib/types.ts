export interface User {
  id: string
  email: string
  name: string
  college: string
  role: "student" | "instructor" | "staff"
  credits: number
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  category: string
  description?: string
  created_at: string
}

export interface UserSkill {
  id: string
  user_id: string
  skill_id: string
  type: "offered" | "wanted"
  proficiency_level?: number
  created_at: string
  skill?: Skill
  user?: User
}

export interface Meetup {
  id: string
  teacher_id: string
  learner_id: string
  skill_id: string
  title: string
  description?: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  location?: string
  mode: "virtual" | "in-person"
  meeting_link?: string
  status: "scheduled" | "completed" | "cancelled"
  credits_cost: number
  created_at: string
  updated_at: string
  teacher?: User
  learner?: User
  skill?: Skill
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: "earned" | "spent"
  description: string
  meetup_id?: string
  created_at: string
  meetup?: Meetup
}

export interface DailyTask {
  id: string
  user_id: string
  task_type: string
  description: string
  credits_reward: number
  completed_date?: string
  created_at: string
}
