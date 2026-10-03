export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Mirrors supabase/migrations/20261003090000_init_schema.sql.
 *
 * Hand-authored until a live project exists; once it does, regenerate with:
 *   npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          timezone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          timezone?: string
          user_id: string
        }
        Update: {
          created_at?: string
          timezone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          note: string
          started_at: string
          task_id: string | null
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          note?: string
          started_at: string
          task_id?: string | null
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          note?: string
          started_at?: string
          task_id?: string | null
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_topic_id_task_id_fkey"
            columns: ["user_id", "topic_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["user_id", "topic_id", "id"]
          },
          {
            foreignKeyName: "sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          position: number
          title: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          position: number
          title: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          title?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_progress: {
        Row: {
          notes: string
          readiness: Database["public"]["Enums"]["readiness"]
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          notes?: string
          readiness?: Database["public"]["Enums"]["readiness"]
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          notes?: string
          readiness?: Database["public"]["Enums"]["readiness"]
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_links: {
        Row: {
          created_at: string
          id: string
          label: string
          topic_id: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          topic_id: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          topic_id?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_links_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          course_links: Json
          curriculum_version: string
          description_cs: string
          display_order: number
          id: string
          official_number: number
          section: Database["public"]["Enums"]["topic_section"]
          source_url: string
          title_cs: string
        }
        Insert: {
          course_links?: Json
          curriculum_version?: string
          description_cs: string
          display_order: number
          id: string
          official_number: number
          section: Database["public"]["Enums"]["topic_section"]
          source_url: string
          title_cs: string
        }
        Update: {
          course_links?: Json
          curriculum_version?: string
          description_cs?: string
          display_order?: number
          id?: string
          official_number?: number
          section?: Database["public"]["Enums"]["topic_section"]
          source_url?: string
          title_cs?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      daily_time_totals: {
        Args: { p_timezone?: string }
        Returns: Array<{ day: string; total_seconds: number }>
      }
      server_now: {
        Args: Record<string, never>
        Returns: string
      }
      study_windows: {
        Args: { p_timezone?: string }
        Returns: Array<{
          today_seconds: number
          week_seconds: number
          all_time_seconds: number
        }>
      }
      start_session: {
        Args: { p_id: string; p_topic_id: string; p_task_id?: string | null }
        Returns: Array<Database["public"]["Tables"]["sessions"]["Row"]>
      }
      stop_session: {
        Args: { p_id: string }
        Returns: Array<Database["public"]["Tables"]["sessions"]["Row"]>
      }
      switch_session: {
        Args: { p_id: string; p_topic_id: string; p_task_id?: string | null }
        Returns: Array<{
          active_session: Database["public"]["Tables"]["sessions"]["Row"]
          previous_session: Database["public"]["Tables"]["sessions"]["Row"] | null
        }>
      }
      task_time_totals: {
        Args: { p_topic_id: string }
        Returns: Array<{ task_id: string; total_seconds: number }>
      }
      topic_time_total: {
        Args: { p_topic_id: string }
        Returns: number
      }
      topic_study_stats: {
        Args: Record<string, never>
        Returns: Array<{
          topic_id: string
          total_seconds: number
          last_ended_at: string | null
        }>
      }
    }
    Enums: {
      readiness: "not_started" | "learning" | "can_explain" | "exam_ready"
      topic_section: "theory" | "systems"
    }
    CompositeTypes: Record<string, never>
  }
}
