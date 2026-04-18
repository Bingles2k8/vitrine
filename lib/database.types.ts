export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          museum_id: string
          object_id: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          museum_id: string
          object_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          museum_id?: string
          object_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_exercises: {
        Row: {
          actions_completed: string | null
          actions_required: string | null
          audit_reference: string
          auditor: string | null
          created_at: string
          date_completed: string | null
          date_started: string
          discrepancies: number | null
          governance_report_date: string | null
          governance_reported: boolean | null
          id: string
          method: string | null
          museum_id: string
          notes: string | null
          objects_checked: number | null
          objects_found: number | null
          objects_not_found: number | null
          overall_audit_report: string | null
          report_reference: string | null
          scope: string | null
          status: string
        }
        Insert: {
          actions_completed?: string | null
          actions_required?: string | null
          audit_reference: string
          auditor?: string | null
          created_at?: string
          date_completed?: string | null
          date_started: string
          discrepancies?: number | null
          governance_report_date?: string | null
          governance_reported?: boolean | null
          id?: string
          method?: string | null
          museum_id: string
          notes?: string | null
          objects_checked?: number | null
          objects_found?: number | null
          objects_not_found?: number | null
          overall_audit_report?: string | null
          report_reference?: string | null
          scope?: string | null
          status?: string
        }
        Update: {
          actions_completed?: string | null
          actions_required?: string | null
          audit_reference?: string
          auditor?: string | null
          created_at?: string
          date_completed?: string | null
          date_started?: string
          discrepancies?: number | null
          governance_report_date?: string | null
          governance_reported?: boolean | null
          id?: string
          method?: string | null
          museum_id?: string
          notes?: string | null
          objects_checked?: number | null
          objects_found?: number | null
          objects_not_found?: number | null
          overall_audit_report?: string | null
          report_reference?: string | null
          scope?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_exercises_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_records: {
        Row: {
          action_completed: boolean | null
          action_completed_date: string | null
          action_required: string | null
          condition_confirmed: string | null
          created_at: string
          discrepancy: string | null
          exercise_id: string | null
          id: string
          inventoried_at: string
          inventoried_by: string | null
          inventory_outcome: string | null
          location_confirmed: string | null
          museum_id: string
          notes: string | null
          object_id: string
        }
        Insert: {
          action_completed?: boolean | null
          action_completed_date?: string | null
          action_required?: string | null
          condition_confirmed?: string | null
          created_at?: string
          discrepancy?: string | null
          exercise_id?: string | null
          id?: string
          inventoried_at: string
          inventoried_by?: string | null
          inventory_outcome?: string | null
          location_confirmed?: string | null
          museum_id: string
          notes?: string | null
          object_id: string
        }
        Update: {
          action_completed?: boolean | null
          action_completed_date?: string | null
          action_required?: string | null
          condition_confirmed?: string | null
          created_at?: string
          discrepancy?: string | null
          exercise_id?: string | null
          id?: string
          inventoried_at?: string
          inventoried_by?: string | null
          inventory_outcome?: string | null
          location_confirmed?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "audit_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_records_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_records_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string
          description: string
          id: string
          keywords: string[]
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string
          id?: string
          keywords?: string[]
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          id?: string
          keywords?: string[]
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      collection_reviews: {
        Row: {
          created_at: string
          criteria: string | null
          governing_body_reported: boolean | null
          id: string
          museum_id: string
          notes: string | null
          objects_recommended_disposal: number | null
          objects_reviewed: number | null
          recommendations: string | null
          report_date: string | null
          review_date_end: string | null
          review_date_start: string
          review_reference: string
          review_title: string
          reviewer: string | null
          scope: string | null
          status: string
        }
        Insert: {
          created_at?: string
          criteria?: string | null
          governing_body_reported?: boolean | null
          id?: string
          museum_id: string
          notes?: string | null
          objects_recommended_disposal?: number | null
          objects_reviewed?: number | null
          recommendations?: string | null
          report_date?: string | null
          review_date_end?: string | null
          review_date_start: string
          review_reference: string
          review_title: string
          reviewer?: string | null
          scope?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          criteria?: string | null
          governing_body_reported?: boolean | null
          id?: string
          museum_id?: string
          notes?: string | null
          objects_recommended_disposal?: number | null
          objects_reviewed?: number | null
          recommendations?: string | null
          report_date?: string | null
          review_date_end?: string | null
          review_date_start?: string
          review_reference?: string
          review_title?: string
          reviewer?: string | null
          scope?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_reviews_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_use_records: {
        Row: {
          approved_by: string | null
          conditions: string | null
          created_at: string
          id: string
          information_generated: string | null
          location_of_use: string | null
          museum_id: string
          notes: string | null
          object_id: string | null
          outcome: string | null
          purpose: string | null
          reproduction_request_id: string | null
          request_date: string
          requester_name: string | null
          requester_org: string | null
          status: string
          use_date_end: string | null
          use_date_start: string | null
          use_reference: string
          use_type: string
        }
        Insert: {
          approved_by?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          information_generated?: string | null
          location_of_use?: string | null
          museum_id: string
          notes?: string | null
          object_id?: string | null
          outcome?: string | null
          purpose?: string | null
          reproduction_request_id?: string | null
          request_date: string
          requester_name?: string | null
          requester_org?: string | null
          status?: string
          use_date_end?: string | null
          use_date_start?: string | null
          use_reference: string
          use_type: string
        }
        Update: {
          approved_by?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          information_generated?: string | null
          location_of_use?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string | null
          outcome?: string | null
          purpose?: string | null
          reproduction_request_id?: string | null
          request_date?: string
          requester_name?: string | null
          requester_org?: string | null
          status?: string
          use_date_end?: string | null
          use_date_start?: string | null
          use_reference?: string
          use_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_use_records_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_use_records_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_use_records_reproduction_request_id_fkey"
            columns: ["reproduction_request_id"]
            isOneToOne: false
            referencedRelation: "reproduction_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_assessments: {
        Row: {
          assessed_at: string
          assessment_reference: string | null
          assessor: string | null
          created_at: string
          grade: string
          hazard_note: string | null
          id: string
          location_on_object: string | null
          long_description: string | null
          museum_id: string
          next_check_date: string | null
          notes: string | null
          object_id: string
          priority: string | null
          reason_for_check: string | null
          recommendations: string | null
          specific_issues: string | null
        }
        Insert: {
          assessed_at: string
          assessment_reference?: string | null
          assessor?: string | null
          created_at?: string
          grade: string
          hazard_note?: string | null
          id?: string
          location_on_object?: string | null
          long_description?: string | null
          museum_id: string
          next_check_date?: string | null
          notes?: string | null
          object_id: string
          priority?: string | null
          reason_for_check?: string | null
          recommendations?: string | null
          specific_issues?: string | null
        }
        Update: {
          assessed_at?: string
          assessment_reference?: string | null
          assessor?: string | null
          created_at?: string
          grade?: string
          hazard_note?: string | null
          id?: string
          location_on_object?: string | null
          long_description?: string | null
          museum_id?: string
          next_check_date?: string | null
          notes?: string | null
          object_id?: string
          priority?: string | null
          reason_for_check?: string | null
          recommendations?: string | null
          specific_issues?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "condition_assessments_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_assessments_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      conservation_treatments: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          condition_after: string | null
          condition_before: string | null
          conservator: string | null
          cost: number | null
          cost_currency: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          images: Json | null
          materials_used: string | null
          museum_id: string
          object_id: string
          outcome: string | null
          recommendation_future: string | null
          start_date: string | null
          status: string
          treatment_name: string | null
          treatment_reference: string | null
          treatment_type: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          condition_after?: string | null
          condition_before?: string | null
          conservator?: string | null
          cost?: number | null
          cost_currency?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          images?: Json | null
          materials_used?: string | null
          museum_id: string
          object_id: string
          outcome?: string | null
          recommendation_future?: string | null
          start_date?: string | null
          status?: string
          treatment_name?: string | null
          treatment_reference?: string | null
          treatment_type: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          condition_after?: string | null
          condition_before?: string | null
          conservator?: string | null
          cost?: number | null
          cost_currency?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          images?: Json | null
          materials_used?: string | null
          museum_id?: string
          object_id?: string
          outcome?: string | null
          recommendation_future?: string | null
          start_date?: string | null
          status?: string
          treatment_name?: string | null
          treatment_reference?: string | null
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conservation_treatments_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conservation_treatments_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_reports: {
        Row: {
          action_taken: string | null
          cause: string | null
          created_at: string
          damage_type: string
          description: string
          discovered_by: string
          discovered_date: string
          id: string
          incident_date: string
          insurance_claim_outcome: string | null
          insurance_claim_ref: string | null
          insurance_notified: boolean
          investigation_notes: string | null
          location_at_incident: string | null
          museum_id: string
          notes: string | null
          object_id: string | null
          object_status_after_event: string | null
          police_report_ref: string | null
          repair_currency: string | null
          repair_estimate: number | null
          report_number: string
          reported_by: string | null
          reported_to_governing_body: boolean | null
          severity: string
          status: string
        }
        Insert: {
          action_taken?: string | null
          cause?: string | null
          created_at?: string
          damage_type?: string
          description: string
          discovered_by: string
          discovered_date: string
          id?: string
          incident_date: string
          insurance_claim_outcome?: string | null
          insurance_claim_ref?: string | null
          insurance_notified?: boolean
          investigation_notes?: string | null
          location_at_incident?: string | null
          museum_id: string
          notes?: string | null
          object_id?: string | null
          object_status_after_event?: string | null
          police_report_ref?: string | null
          repair_currency?: string | null
          repair_estimate?: number | null
          report_number: string
          reported_by?: string | null
          reported_to_governing_body?: boolean | null
          severity?: string
          status?: string
        }
        Update: {
          action_taken?: string | null
          cause?: string | null
          created_at?: string
          damage_type?: string
          description?: string
          discovered_by?: string
          discovered_date?: string
          id?: string
          incident_date?: string
          insurance_claim_outcome?: string | null
          insurance_claim_ref?: string | null
          insurance_notified?: boolean
          investigation_notes?: string | null
          location_at_incident?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string | null
          object_status_after_event?: string | null
          police_report_ref?: string | null
          repair_currency?: string | null
          repair_estimate?: number | null
          report_number?: string
          reported_by?: string | null
          reported_to_governing_body?: boolean | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      disposal_record_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          disposal_id: string
          document_type: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          label: string
          mime_type: string | null
          museum_id: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          disposal_id: string
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          label: string
          mime_type?: string | null
          museum_id: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          disposal_id?: string
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          label?: string
          mime_type?: string | null
          museum_id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disposal_record_documents_disposal_id_fkey"
            columns: ["disposal_id"]
            isOneToOne: false
            referencedRelation: "disposal_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disposal_record_documents_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      disposal_records: {
        Row: {
          authorised_by: string
          created_at: string
          deaccession_date: string
          disposal_method: string
          disposal_reason: string
          disposal_reference: string
          governing_body_approval: boolean | null
          governing_body_date: string | null
          id: string
          justification: string | null
          museum_id: string
          notes: string | null
          object_id: string
          outcome_documentation: string | null
          proceeds_amount: number | null
          proceeds_currency: string | null
          public_notice: string | null
          public_notice_date: string | null
          recipient_contact: string | null
          recipient_name: string | null
          register_annotated: boolean | null
          status: string
        }
        Insert: {
          authorised_by: string
          created_at?: string
          deaccession_date: string
          disposal_method: string
          disposal_reason: string
          disposal_reference: string
          governing_body_approval?: boolean | null
          governing_body_date?: string | null
          id?: string
          justification?: string | null
          museum_id: string
          notes?: string | null
          object_id: string
          outcome_documentation?: string | null
          proceeds_amount?: number | null
          proceeds_currency?: string | null
          public_notice?: string | null
          public_notice_date?: string | null
          recipient_contact?: string | null
          recipient_name?: string | null
          register_annotated?: boolean | null
          status?: string
        }
        Update: {
          authorised_by?: string
          created_at?: string
          deaccession_date?: string
          disposal_method?: string
          disposal_reason?: string
          disposal_reference?: string
          governing_body_approval?: boolean | null
          governing_body_date?: string | null
          id?: string
          justification?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string
          outcome_documentation?: string | null
          proceeds_amount?: number | null
          proceeds_currency?: string | null
          public_notice?: string | null
          public_notice_date?: string | null
          recipient_contact?: string | null
          recipient_name?: string | null
          register_annotated?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disposal_records_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disposal_records_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_plan_backlogs: {
        Row: {
          backlog_count: number | null
          created_at: string
          id: string
          museum_id: string
          notes: string | null
          plan_id: string
          priority: string | null
          procedure_name: string
          target_date: string | null
        }
        Insert: {
          backlog_count?: number | null
          created_at?: string
          id?: string
          museum_id: string
          notes?: string | null
          plan_id: string
          priority?: string | null
          procedure_name: string
          target_date?: string | null
        }
        Update: {
          backlog_count?: number | null
          created_at?: string
          id?: string
          museum_id?: string
          notes?: string | null
          plan_id?: string
          priority?: string | null
          procedure_name?: string
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_plan_backlogs_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_plan_backlogs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "documentation_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_plan_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          label: string
          mime_type: string | null
          museum_id: string
          notes: string | null
          plan_id: string
          section: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          label: string
          mime_type?: string | null
          museum_id: string
          notes?: string | null
          plan_id: string
          section?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          label?: string
          mime_type?: string | null
          museum_id?: string
          notes?: string | null
          plan_id?: string
          section?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_plan_documents_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_plan_documents_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "documentation_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_plans: {
        Row: {
          access_permissions: string | null
          accreditation_scheme: string | null
          backlog_notes: string | null
          collection_overview: string | null
          created_at: string
          documentation_gaps: string | null
          documentation_standards: string | null
          ethical_framework: string | null
          id: string
          legal_framework: string | null
          museum_id: string
          plan_date: string | null
          plan_reference: string | null
          priority_order: string | null
          resources_allocated: string | null
          responsible_person: string | null
          review_date: string | null
          scope_documented_pct: number | null
          specific_objectives: string | null
          status: string
          system_maintenance: string | null
          systems_in_use: string | null
          target_completion_dates: string | null
          updated_at: string
        }
        Insert: {
          access_permissions?: string | null
          accreditation_scheme?: string | null
          backlog_notes?: string | null
          collection_overview?: string | null
          created_at?: string
          documentation_gaps?: string | null
          documentation_standards?: string | null
          ethical_framework?: string | null
          id?: string
          legal_framework?: string | null
          museum_id: string
          plan_date?: string | null
          plan_reference?: string | null
          priority_order?: string | null
          resources_allocated?: string | null
          responsible_person?: string | null
          review_date?: string | null
          scope_documented_pct?: number | null
          specific_objectives?: string | null
          status?: string
          system_maintenance?: string | null
          systems_in_use?: string | null
          target_completion_dates?: string | null
          updated_at?: string
        }
        Update: {
          access_permissions?: string | null
          accreditation_scheme?: string | null
          backlog_notes?: string | null
          collection_overview?: string | null
          created_at?: string
          documentation_gaps?: string | null
          documentation_standards?: string | null
          ethical_framework?: string | null
          id?: string
          legal_framework?: string | null
          museum_id?: string
          plan_date?: string | null
          plan_reference?: string | null
          priority_order?: string | null
          resources_allocated?: string | null
          responsible_person?: string | null
          review_date?: string | null
          scope_documented_pct?: number | null
          specific_objectives?: string | null
          status?: string
          system_maintenance?: string | null
          systems_in_use?: string | null
          target_completion_dates?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_plans_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_event_objects: {
        Row: {
          created_at: string
          event_id: string
          id: string
          museum_id: string
          notes: string | null
          object_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          museum_id: string
          notes?: string | null
          object_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          museum_id?: string
          notes?: string | null
          object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_event_objects_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "emergency_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_event_objects_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_event_objects_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_events: {
        Row: {
          created_at: string
          damage_summary: string | null
          description: string
          event_date: string
          event_reference: string
          event_type: string
          id: string
          lessons_learned: string | null
          museum_id: string
          notes: string | null
          plan_id: string | null
          response_taken: string | null
          status: string
        }
        Insert: {
          created_at?: string
          damage_summary?: string | null
          description: string
          event_date: string
          event_reference: string
          event_type: string
          id?: string
          lessons_learned?: string | null
          museum_id: string
          notes?: string | null
          plan_id?: string | null
          response_taken?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          damage_summary?: string | null
          description?: string
          event_date?: string
          event_reference?: string
          event_type?: string
          id?: string
          lessons_learned?: string | null
          museum_id?: string
          notes?: string | null
          plan_id?: string | null
          response_taken?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_events_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_events_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "emergency_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_plan_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          label: string
          mime_type: string | null
          museum_id: string
          notes: string | null
          plan_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          label: string
          mime_type?: string | null
          museum_id: string
          notes?: string | null
          plan_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          label?: string
          mime_type?: string | null
          museum_id?: string
          notes?: string | null
          plan_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_plan_documents_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_plan_documents_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "emergency_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_plans: {
        Row: {
          alternative_storage: string | null
          created_at: string
          emergency_contacts: string | null
          evacuation_procedures: string | null
          id: string
          last_review_date: string | null
          museum_id: string
          next_review_date: string | null
          notes: string | null
          plan_last_tested: string | null
          plan_title: string
          plan_type: string
          recovery_procedures: string | null
          responsible_person: string | null
          salvage_equipment_location: string | null
          salvage_priorities: string | null
          status: string
        }
        Insert: {
          alternative_storage?: string | null
          created_at?: string
          emergency_contacts?: string | null
          evacuation_procedures?: string | null
          id?: string
          last_review_date?: string | null
          museum_id: string
          next_review_date?: string | null
          notes?: string | null
          plan_last_tested?: string | null
          plan_title: string
          plan_type?: string
          recovery_procedures?: string | null
          responsible_person?: string | null
          salvage_equipment_location?: string | null
          salvage_priorities?: string | null
          status?: string
        }
        Update: {
          alternative_storage?: string | null
          created_at?: string
          emergency_contacts?: string | null
          evacuation_procedures?: string | null
          id?: string
          last_review_date?: string | null
          museum_id?: string
          next_review_date?: string | null
          notes?: string | null
          plan_last_tested?: string | null
          plan_title?: string
          plan_type?: string
          recovery_procedures?: string | null
          responsible_person?: string | null
          salvage_equipment_location?: string | null
          salvage_priorities?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_plans_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_salvage_priorities: {
        Row: {
          created_at: string
          id: string
          museum_id: string
          object_id: string
          plan_id: string
          priority_rank: number
          salvage_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          museum_id: string
          object_id: string
          plan_id: string
          priority_rank: number
          salvage_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          museum_id?: string
          object_id?: string
          plan_id?: string
          priority_rank?: number
          salvage_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_salvage_priorities_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_salvage_priorities_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_salvage_priorities_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "emergency_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_records: {
        Row: {
          condition_on_entry: string | null
          created_at: string
          depositor_contact: string | null
          depositor_name: string
          depositor_signed: boolean | null
          depositor_signed_date: string | null
          digital_acknowledgement: boolean | null
          digital_acknowledgement_date: string | null
          entry_date: string
          entry_method: string | null
          entry_number: string
          entry_reason: string
          gdpr_consent: boolean | null
          gdpr_consent_date: string | null
          id: string
          legal_owner: string | null
          liability_statement: string | null
          museum_id: string
          notes: string | null
          object_count: number
          object_description: string
          object_id: string | null
          outcome: string | null
          quarantine_required: boolean | null
          receipt_date: string | null
          receipt_issued: boolean
          received_by: string
          risk_notes: string | null
          scheduled_return_date: string | null
          terms_accepted: boolean
          terms_accepted_date: string | null
        }
        Insert: {
          condition_on_entry?: string | null
          created_at?: string
          depositor_contact?: string | null
          depositor_name: string
          depositor_signed?: boolean | null
          depositor_signed_date?: string | null
          digital_acknowledgement?: boolean | null
          digital_acknowledgement_date?: string | null
          entry_date: string
          entry_method?: string | null
          entry_number: string
          entry_reason: string
          gdpr_consent?: boolean | null
          gdpr_consent_date?: string | null
          id?: string
          legal_owner?: string | null
          liability_statement?: string | null
          museum_id: string
          notes?: string | null
          object_count?: number
          object_description: string
          object_id?: string | null
          outcome?: string | null
          quarantine_required?: boolean | null
          receipt_date?: string | null
          receipt_issued?: boolean
          received_by: string
          risk_notes?: string | null
          scheduled_return_date?: string | null
          terms_accepted?: boolean
          terms_accepted_date?: string | null
        }
        Update: {
          condition_on_entry?: string | null
          created_at?: string
          depositor_contact?: string | null
          depositor_name?: string
          depositor_signed?: boolean | null
          depositor_signed_date?: string | null
          digital_acknowledgement?: boolean | null
          digital_acknowledgement_date?: string | null
          entry_date?: string
          entry_method?: string | null
          entry_number?: string
          entry_reason?: string
          gdpr_consent?: boolean | null
          gdpr_consent_date?: string | null
          id?: string
          legal_owner?: string | null
          liability_statement?: string | null
          museum_id?: string
          notes?: string | null
          object_count?: number
          object_description?: string
          object_id?: string | null
          outcome?: string | null
          quarantine_required?: boolean | null
          receipt_date?: string | null
          receipt_issued?: boolean
          received_by?: string
          risk_notes?: string | null
          scheduled_return_date?: string | null
          terms_accepted?: boolean
          terms_accepted_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_records_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_records_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_time_slots: {
        Row: {
          booked_count: number
          capacity: number
          created_at: string
          end_time: string
          event_id: string
          id: string
          open_entry: boolean
          start_time: string
        }
        Insert: {
          booked_count?: number
          capacity?: number
          created_at?: string
          end_time: string
          event_id: string
          id?: string
          open_entry?: boolean
          start_time: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          created_at?: string
          end_time?: string
          event_id?: string
          id?: string
          open_entry?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_time_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          end_date: string
          event_type: string
          id: string
          image_url: string | null
          location: string | null
          museum_id: string
          price_cents: number
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          end_date: string
          event_type?: string
          id?: string
          image_url?: string | null
          location?: string | null
          museum_id: string
          price_cents?: number
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          image_url?: string | null
          location?: string | null
          museum_id?: string
          price_cents?: number
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          claims_procedure: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          coverage_amount: number | null
          coverage_type: string
          covers_exhibition: boolean
          covers_loans: boolean
          covers_transit: boolean
          created_at: string
          currency: string
          deductible: number | null
          end_date: string | null
          exclusions: string | null
          id: string
          indemnity_reference: string | null
          museum_id: string
          notes: string | null
          policy_number: string
          provider: string
          related_loan_id: string | null
          renewal_date: string | null
          start_date: string
          status: string
        }
        Insert: {
          claims_procedure?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          coverage_amount?: number | null
          coverage_type?: string
          covers_exhibition?: boolean
          covers_loans?: boolean
          covers_transit?: boolean
          created_at?: string
          currency?: string
          deductible?: number | null
          end_date?: string | null
          exclusions?: string | null
          id?: string
          indemnity_reference?: string | null
          museum_id: string
          notes?: string | null
          policy_number: string
          provider: string
          related_loan_id?: string | null
          renewal_date?: string | null
          start_date: string
          status?: string
        }
        Update: {
          claims_procedure?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          coverage_amount?: number | null
          coverage_type?: string
          covers_exhibition?: boolean
          covers_loans?: boolean
          covers_transit?: boolean
          created_at?: string
          currency?: string
          deductible?: number | null
          end_date?: string | null
          exclusions?: string | null
          id?: string
          indemnity_reference?: string | null
          museum_id?: string
          notes?: string | null
          policy_number?: string
          provider?: string
          related_loan_id?: string | null
          renewal_date?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_related_loan_id_fkey"
            columns: ["related_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policy_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          label: string
          mime_type: string | null
          museum_id: string
          notes: string | null
          policy_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          label: string
          mime_type?: string | null
          museum_id: string
          notes?: string | null
          policy_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          label?: string
          mime_type?: string | null
          museum_id?: string
          notes?: string | null
          policy_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policy_documents_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policy_objects: {
        Row: {
          created_at: string
          id: string
          museum_id: string
          notes: string | null
          object_id: string
          policy_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          museum_id: string
          notes?: string | null
          object_id: string
          policy_id: string
        }
        Update: {
          created_at?: string
          id?: string
          museum_id?: string
          notes?: string | null
          object_id?: string
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policy_objects_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policy_objects_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policy_objects_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          agreement_reference: string | null
          agreement_signed_date: string | null
          approved_by: string | null
          borrower_address: string | null
          borrower_phone: string | null
          borrowing_institution: string | null
          condition_arrival: string | null
          condition_return: string | null
          conditions: string | null
          contact_email: string | null
          contact_name: string | null
          courier_transport_arrangements: string | null
          created_at: string
          direction: string
          display_requirements: string | null
          environmental_requirements: string | null
          facility_report_reference: string | null
          id: string
          insurance_currency: string
          insurance_type: string | null
          insurance_value: number | null
          lender_object_ref: string | null
          loan_coordinator: string | null
          loan_end_date: string | null
          loan_number: string | null
          loan_reference: string | null
          loan_start_date: string | null
          museum_id: string
          notes: string | null
          object_id: string
          object_location_during_loan: string | null
          purpose: string | null
          return_confirmed: boolean | null
          return_confirmed_date: string | null
          status: string
        }
        Insert: {
          agreement_reference?: string | null
          agreement_signed_date?: string | null
          approved_by?: string | null
          borrower_address?: string | null
          borrower_phone?: string | null
          borrowing_institution?: string | null
          condition_arrival?: string | null
          condition_return?: string | null
          conditions?: string | null
          contact_email?: string | null
          contact_name?: string | null
          courier_transport_arrangements?: string | null
          created_at?: string
          direction: string
          display_requirements?: string | null
          environmental_requirements?: string | null
          facility_report_reference?: string | null
          id?: string
          insurance_currency?: string
          insurance_type?: string | null
          insurance_value?: number | null
          lender_object_ref?: string | null
          loan_coordinator?: string | null
          loan_end_date?: string | null
          loan_number?: string | null
          loan_reference?: string | null
          loan_start_date?: string | null
          museum_id: string
          notes?: string | null
          object_id: string
          object_location_during_loan?: string | null
          purpose?: string | null
          return_confirmed?: boolean | null
          return_confirmed_date?: string | null
          status?: string
        }
        Update: {
          agreement_reference?: string | null
          agreement_signed_date?: string | null
          approved_by?: string | null
          borrower_address?: string | null
          borrower_phone?: string | null
          borrowing_institution?: string | null
          condition_arrival?: string | null
          condition_return?: string | null
          conditions?: string | null
          contact_email?: string | null
          contact_name?: string | null
          courier_transport_arrangements?: string | null
          created_at?: string
          direction?: string
          display_requirements?: string | null
          environmental_requirements?: string | null
          facility_report_reference?: string | null
          id?: string
          insurance_currency?: string
          insurance_type?: string | null
          insurance_value?: number | null
          lender_object_ref?: string | null
          loan_coordinator?: string | null
          loan_end_date?: string | null
          loan_number?: string | null
          loan_reference?: string | null
          loan_start_date?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string
          object_location_during_loan?: string | null
          purpose?: string | null
          return_confirmed?: boolean | null
          return_confirmed_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      location_history: {
        Row: {
          authorised_by: string | null
          created_at: string
          expected_return_date: string | null
          expected_return_location: string | null
          id: string
          location: string
          location_code: string | null
          move_type: string | null
          moved_at: string
          moved_by: string | null
          museum_id: string
          object_id: string
          reason: string | null
        }
        Insert: {
          authorised_by?: string | null
          created_at?: string
          expected_return_date?: string | null
          expected_return_location?: string | null
          id?: string
          location: string
          location_code?: string | null
          move_type?: string | null
          moved_at?: string
          moved_by?: string | null
          museum_id: string
          object_id: string
          reason?: string | null
        }
        Update: {
          authorised_by?: string | null
          created_at?: string
          expected_return_date?: string | null
          expected_return_location?: string | null
          id?: string
          location?: string
          location_code?: string | null
          move_type?: string | null
          moved_at?: string
          moved_by?: string | null
          museum_id?: string
          object_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_history_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_history_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          access_restrictions: string | null
          building: string | null
          capacity_notes: string | null
          created_at: string
          environmental_notes: string | null
          floor: string | null
          id: string
          location_code: string | null
          location_type: string
          museum_id: string
          name: string
          position1: string | null
          position2: string | null
          position3: string | null
          room_gallery: string | null
          status: string
        }
        Insert: {
          access_restrictions?: string | null
          building?: string | null
          capacity_notes?: string | null
          created_at?: string
          environmental_notes?: string | null
          floor?: string | null
          id?: string
          location_code?: string | null
          location_type?: string
          museum_id: string
          name: string
          position1?: string | null
          position2?: string | null
          position3?: string | null
          room_gallery?: string | null
          status?: string
        }
        Update: {
          access_restrictions?: string | null
          building?: string | null
          capacity_notes?: string | null
          created_at?: string
          environmental_notes?: string | null
          floor?: string | null
          id?: string
          location_code?: string | null
          location_type?: string
          museum_id?: string
          name?: string
          position1?: string | null
          position2?: string | null
          position3?: string | null
          room_gallery?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      museums: {
        Row: {
          about_text: string | null
          accent_color: string | null
          address: string | null
          card_metadata: string | null
          card_padding: string | null
          card_radius: number | null
          collecting_since: string | null
          collection_category: string | null
          collection_label: string | null
          collector_bio: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          dark_mode: boolean | null
          discoverable: boolean
          facilities: string | null
          footer_text: string | null
          grid_columns: number | null
          heading_font: string
          hero_height: string | null
          hero_image_position: string
          hero_image_url: string | null
          hide_vitrine_branding: boolean | null
          id: string
          image_ratio: string | null
          logo_emoji: string | null
          logo_image_url: string | null
          maps_embed_url: string | null
          name: string
          opening_hours: string | null
          owner_id: string | null
          payment_past_due: boolean
          pending_downgrade_date: string | null
          pending_downgrade_plan: string | null
          plan: string | null
          primary_color: string | null
          seo_description: string | null
          show_collection_value: boolean | null
          show_wanted: boolean | null
          slug: string
          social_facebook: string | null
          social_instagram: string | null
          social_twitter: string | null
          social_website: string | null
          storage_used_bytes: number
          stripe_connect_id: string | null
          stripe_connect_onboarded: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tagline: string | null
          template: string | null
          ui_mode: string
        }
        Insert: {
          about_text?: string | null
          accent_color?: string | null
          address?: string | null
          card_metadata?: string | null
          card_padding?: string | null
          card_radius?: number | null
          collecting_since?: string | null
          collection_category?: string | null
          collection_label?: string | null
          collector_bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          discoverable?: boolean
          facilities?: string | null
          footer_text?: string | null
          grid_columns?: number | null
          heading_font?: string
          hero_height?: string | null
          hero_image_position?: string
          hero_image_url?: string | null
          hide_vitrine_branding?: boolean | null
          id?: string
          image_ratio?: string | null
          logo_emoji?: string | null
          logo_image_url?: string | null
          maps_embed_url?: string | null
          name: string
          opening_hours?: string | null
          owner_id?: string | null
          payment_past_due?: boolean
          pending_downgrade_date?: string | null
          pending_downgrade_plan?: string | null
          plan?: string | null
          primary_color?: string | null
          seo_description?: string | null
          show_collection_value?: boolean | null
          show_wanted?: boolean | null
          slug: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          social_website?: string | null
          storage_used_bytes?: number
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tagline?: string | null
          template?: string | null
          ui_mode?: string
        }
        Update: {
          about_text?: string | null
          accent_color?: string | null
          address?: string | null
          card_metadata?: string | null
          card_padding?: string | null
          card_radius?: number | null
          collecting_since?: string | null
          collection_category?: string | null
          collection_label?: string | null
          collector_bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          discoverable?: boolean
          facilities?: string | null
          footer_text?: string | null
          grid_columns?: number | null
          heading_font?: string
          hero_height?: string | null
          hero_image_position?: string
          hero_image_url?: string | null
          hide_vitrine_branding?: boolean | null
          id?: string
          image_ratio?: string | null
          logo_emoji?: string | null
          logo_image_url?: string | null
          maps_embed_url?: string | null
          name?: string
          opening_hours?: string | null
          owner_id?: string | null
          payment_past_due?: boolean
          pending_downgrade_date?: string | null
          pending_downgrade_plan?: string | null
          plan?: string | null
          primary_color?: string | null
          seo_description?: string | null
          show_collection_value?: boolean | null
          show_wanted?: boolean | null
          slug?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          social_website?: string | null
          storage_used_bytes?: number
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tagline?: string | null
          template?: string | null
          ui_mode?: string
        }
        Relationships: []
      }
      object_components: {
        Row: {
          component_accession_no: string | null
          component_number: number
          created_at: string | null
          id: string
          museum_id: string
          notes: string | null
          parent_object_id: string
          part_number_label: string | null
          title: string | null
        }
        Insert: {
          component_accession_no?: string | null
          component_number: number
          created_at?: string | null
          id?: string
          museum_id: string
          notes?: string | null
          parent_object_id: string
          part_number_label?: string | null
          title?: string | null
        }
        Update: {
          component_accession_no?: string | null
          component_number?: number
          created_at?: string | null
          id?: string
          museum_id?: string
          notes?: string | null
          parent_object_id?: string
          part_number_label?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_components_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_components_parent_object_id_fkey"
            columns: ["parent_object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      object_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          label: string
          mime_type: string | null
          museum_id: string
          notes: string | null
          object_id: string
          related_to_id: string | null
          related_to_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          label: string
          mime_type?: string | null
          museum_id: string
          notes?: string | null
          object_id: string
          related_to_id?: string | null
          related_to_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          label?: string
          mime_type?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string
          related_to_id?: string | null
          related_to_type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_documents_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_documents_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      object_duplicates: {
        Row: {
          created_at: string
          duplicate_of_id: string
          id: string
          museum_id: string
          object_id: string
        }
        Insert: {
          created_at?: string
          duplicate_of_id: string
          id?: string
          museum_id: string
          object_id: string
        }
        Update: {
          created_at?: string
          duplicate_of_id?: string
          id?: string
          museum_id?: string
          object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_duplicates_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_duplicates_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_duplicates_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      object_exits: {
        Row: {
          created_at: string
          destination_address: string | null
          exit_authorised_by: string
          exit_condition: string | null
          exit_date: string
          exit_number: string
          exit_reason: string
          expected_return_date: string | null
          id: string
          insurance_indemnity_confirmed: boolean | null
          museum_id: string
          notes: string | null
          object_id: string
          packing_notes: string | null
          recipient_contact: string | null
          recipient_name: string
          related_loan_id: string | null
          signed_receipt: boolean
          signed_receipt_date: string | null
          transport_method: string | null
        }
        Insert: {
          created_at?: string
          destination_address?: string | null
          exit_authorised_by: string
          exit_condition?: string | null
          exit_date: string
          exit_number: string
          exit_reason: string
          expected_return_date?: string | null
          id?: string
          insurance_indemnity_confirmed?: boolean | null
          museum_id: string
          notes?: string | null
          object_id: string
          packing_notes?: string | null
          recipient_contact?: string | null
          recipient_name: string
          related_loan_id?: string | null
          signed_receipt?: boolean
          signed_receipt_date?: string | null
          transport_method?: string | null
        }
        Update: {
          created_at?: string
          destination_address?: string | null
          exit_authorised_by?: string
          exit_condition?: string | null
          exit_date?: string
          exit_number?: string
          exit_reason?: string
          expected_return_date?: string | null
          id?: string
          insurance_indemnity_confirmed?: boolean | null
          museum_id?: string
          notes?: string | null
          object_id?: string
          packing_notes?: string | null
          recipient_contact?: string | null
          recipient_name?: string
          related_loan_id?: string | null
          signed_receipt?: boolean
          signed_receipt_date?: string | null
          transport_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_exits_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_exits_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_exits_related_loan_id_fkey"
            columns: ["related_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      object_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_primary: boolean
          museum_id: string
          object_id: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          museum_id: string
          object_id: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          museum_id?: string
          object_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_images_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_images_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      objects: {
        Row: {
          accession_date: string | null
          accession_no: string | null
          accession_register_confirmed: boolean | null
          acknowledgement_sent_to_donor: boolean | null
          acquisition_authorised_by: string | null
          acquisition_authority_date: string | null
          acquisition_currency: string | null
          acquisition_date: string | null
          acquisition_documentation_ref: string | null
          acquisition_ethics_notes: string | null
          acquisition_justification: string | null
          acquisition_method: string | null
          acquisition_note: string | null
          acquisition_object_count: number | null
          acquisition_source: string | null
          acquisition_source_contact: string | null
          acquisition_title_guarantee: string | null
          acquisition_value: number | null
          artist: string | null
          associated_concept: string | null
          associated_event: string | null
          associated_organisation: string | null
          associated_person: string | null
          associated_place: string | null
          attributed_to: string | null
          attribution_notes: string | null
          category: string | null
          colour: string | null
          condition_assessor: string | null
          condition_date: string | null
          condition_grade: string | null
          conditions_attached_to_acquisition: string | null
          copyright_status: string | null
          copyright_status_checked: boolean | null
          created_at: string | null
          credit_line: string | null
          culture: string | null
          current_location: string | null
          deaccession_protected: boolean | null
          deleted_at: string | null
          description: string | null
          dimension_depth: number | null
          dimension_height: number | null
          dimension_notes: string | null
          dimension_unit: string | null
          dimension_weight: number | null
          dimension_weight_unit: string | null
          dimension_width: number | null
          dimensions: string | null
          disposal_authorization: string | null
          disposal_date: string | null
          disposal_method: string | null
          disposal_note: string | null
          disposal_recipient: string | null
          distinguishing_features: string | null
          emoji: string | null
          estimated_value: number | null
          estimated_value_currency: string | null
          ethics_art_loss_register: boolean | null
          ethics_cites: boolean | null
          ethics_dealing_act: boolean | null
          ethics_human_remains: boolean | null
          featured_order: number | null
          field_collection_info: string | null
          formally_accessioned: boolean | null
          full_description: string | null
          hazard_note: string | null
          historical_context: string | null
          id: string
          image_url: string | null
          inscription: string | null
          insured_value: number | null
          insured_value_currency: string | null
          inventoried_by: string | null
          is_featured: boolean | null
          is_gift: boolean | null
          last_inventoried: string | null
          legal_transfer_date: string | null
          licence_type_terms: string | null
          location_after_accessioning: string | null
          location_note: string | null
          maker_name: string | null
          maker_role: string | null
          marks: string | null
          medium: string | null
          museum_id: string | null
          non_accession_reason: string | null
          number_of_parts: number | null
          object_type: string | null
          other_names: string | null
          physical_description: string | null
          physical_materials: string | null
          production_date: string | null
          production_date_early: string | null
          production_date_late: string | null
          production_date_qualifier: string | null
          production_place: string | null
          provenance: string | null
          provenance_date_range: string | null
          rarity: string | null
          record_completeness: string | null
          record_source: string | null
          rights_expiry_date: string | null
          rights_holder: string | null
          rights_holder_contact: string | null
          rights_in_obtained: boolean | null
          rights_notes: string | null
          rights_out_granted: boolean | null
          rights_type: string | null
          school_style_period: string | null
          shape: string | null
          show_on_site: boolean
          status: string | null
          subject_depicted: string | null
          surface_treatment: string | null
          technique: string | null
          title: string
          year: string | null
        }
        Insert: {
          accession_date?: string | null
          accession_no?: string | null
          accession_register_confirmed?: boolean | null
          acknowledgement_sent_to_donor?: boolean | null
          acquisition_authorised_by?: string | null
          acquisition_authority_date?: string | null
          acquisition_currency?: string | null
          acquisition_date?: string | null
          acquisition_documentation_ref?: string | null
          acquisition_ethics_notes?: string | null
          acquisition_justification?: string | null
          acquisition_method?: string | null
          acquisition_note?: string | null
          acquisition_object_count?: number | null
          acquisition_source?: string | null
          acquisition_source_contact?: string | null
          acquisition_title_guarantee?: string | null
          acquisition_value?: number | null
          artist?: string | null
          associated_concept?: string | null
          associated_event?: string | null
          associated_organisation?: string | null
          associated_person?: string | null
          associated_place?: string | null
          attributed_to?: string | null
          attribution_notes?: string | null
          category?: string | null
          colour?: string | null
          condition_assessor?: string | null
          condition_date?: string | null
          condition_grade?: string | null
          conditions_attached_to_acquisition?: string | null
          copyright_status?: string | null
          copyright_status_checked?: boolean | null
          created_at?: string | null
          credit_line?: string | null
          culture?: string | null
          current_location?: string | null
          deaccession_protected?: boolean | null
          deleted_at?: string | null
          description?: string | null
          dimension_depth?: number | null
          dimension_height?: number | null
          dimension_notes?: string | null
          dimension_unit?: string | null
          dimension_weight?: number | null
          dimension_weight_unit?: string | null
          dimension_width?: number | null
          dimensions?: string | null
          disposal_authorization?: string | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_note?: string | null
          disposal_recipient?: string | null
          distinguishing_features?: string | null
          emoji?: string | null
          estimated_value?: number | null
          estimated_value_currency?: string | null
          ethics_art_loss_register?: boolean | null
          ethics_cites?: boolean | null
          ethics_dealing_act?: boolean | null
          ethics_human_remains?: boolean | null
          featured_order?: number | null
          field_collection_info?: string | null
          formally_accessioned?: boolean | null
          full_description?: string | null
          hazard_note?: string | null
          historical_context?: string | null
          id?: string
          image_url?: string | null
          inscription?: string | null
          insured_value?: number | null
          insured_value_currency?: string | null
          inventoried_by?: string | null
          is_featured?: boolean | null
          is_gift?: boolean | null
          last_inventoried?: string | null
          legal_transfer_date?: string | null
          licence_type_terms?: string | null
          location_after_accessioning?: string | null
          location_note?: string | null
          maker_name?: string | null
          maker_role?: string | null
          marks?: string | null
          medium?: string | null
          museum_id?: string | null
          non_accession_reason?: string | null
          number_of_parts?: number | null
          object_type?: string | null
          other_names?: string | null
          physical_description?: string | null
          physical_materials?: string | null
          production_date?: string | null
          production_date_early?: string | null
          production_date_late?: string | null
          production_date_qualifier?: string | null
          production_place?: string | null
          provenance?: string | null
          provenance_date_range?: string | null
          rarity?: string | null
          record_completeness?: string | null
          record_source?: string | null
          rights_expiry_date?: string | null
          rights_holder?: string | null
          rights_holder_contact?: string | null
          rights_in_obtained?: boolean | null
          rights_notes?: string | null
          rights_out_granted?: boolean | null
          rights_type?: string | null
          school_style_period?: string | null
          shape?: string | null
          show_on_site?: boolean
          status?: string | null
          subject_depicted?: string | null
          surface_treatment?: string | null
          technique?: string | null
          title: string
          year?: string | null
        }
        Update: {
          accession_date?: string | null
          accession_no?: string | null
          accession_register_confirmed?: boolean | null
          acknowledgement_sent_to_donor?: boolean | null
          acquisition_authorised_by?: string | null
          acquisition_authority_date?: string | null
          acquisition_currency?: string | null
          acquisition_date?: string | null
          acquisition_documentation_ref?: string | null
          acquisition_ethics_notes?: string | null
          acquisition_justification?: string | null
          acquisition_method?: string | null
          acquisition_note?: string | null
          acquisition_object_count?: number | null
          acquisition_source?: string | null
          acquisition_source_contact?: string | null
          acquisition_title_guarantee?: string | null
          acquisition_value?: number | null
          artist?: string | null
          associated_concept?: string | null
          associated_event?: string | null
          associated_organisation?: string | null
          associated_person?: string | null
          associated_place?: string | null
          attributed_to?: string | null
          attribution_notes?: string | null
          category?: string | null
          colour?: string | null
          condition_assessor?: string | null
          condition_date?: string | null
          condition_grade?: string | null
          conditions_attached_to_acquisition?: string | null
          copyright_status?: string | null
          copyright_status_checked?: boolean | null
          created_at?: string | null
          credit_line?: string | null
          culture?: string | null
          current_location?: string | null
          deaccession_protected?: boolean | null
          deleted_at?: string | null
          description?: string | null
          dimension_depth?: number | null
          dimension_height?: number | null
          dimension_notes?: string | null
          dimension_unit?: string | null
          dimension_weight?: number | null
          dimension_weight_unit?: string | null
          dimension_width?: number | null
          dimensions?: string | null
          disposal_authorization?: string | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_note?: string | null
          disposal_recipient?: string | null
          distinguishing_features?: string | null
          emoji?: string | null
          estimated_value?: number | null
          estimated_value_currency?: string | null
          ethics_art_loss_register?: boolean | null
          ethics_cites?: boolean | null
          ethics_dealing_act?: boolean | null
          ethics_human_remains?: boolean | null
          featured_order?: number | null
          field_collection_info?: string | null
          formally_accessioned?: boolean | null
          full_description?: string | null
          hazard_note?: string | null
          historical_context?: string | null
          id?: string
          image_url?: string | null
          inscription?: string | null
          insured_value?: number | null
          insured_value_currency?: string | null
          inventoried_by?: string | null
          is_featured?: boolean | null
          is_gift?: boolean | null
          last_inventoried?: string | null
          legal_transfer_date?: string | null
          licence_type_terms?: string | null
          location_after_accessioning?: string | null
          location_note?: string | null
          maker_name?: string | null
          maker_role?: string | null
          marks?: string | null
          medium?: string | null
          museum_id?: string | null
          non_accession_reason?: string | null
          number_of_parts?: number | null
          object_type?: string | null
          other_names?: string | null
          physical_description?: string | null
          physical_materials?: string | null
          production_date?: string | null
          production_date_early?: string | null
          production_date_late?: string | null
          production_date_qualifier?: string | null
          production_place?: string | null
          provenance?: string | null
          provenance_date_range?: string | null
          rarity?: string | null
          record_completeness?: string | null
          record_source?: string | null
          rights_expiry_date?: string | null
          rights_holder?: string | null
          rights_holder_contact?: string | null
          rights_in_obtained?: boolean | null
          rights_notes?: string | null
          rights_out_granted?: boolean | null
          rights_type?: string | null
          school_style_period?: string | null
          shape?: string | null
          show_on_site?: boolean
          status?: string | null
          subject_depicted?: string | null
          surface_treatment?: string | null
          technique?: string | null
          title?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          museum_id: string
          object_id: string | null
          page_type: string
          viewed_at: string
        }
        Insert: {
          id?: string
          museum_id: string
          object_id?: string | null
          page_type: string
          viewed_at?: string
        }
        Update: {
          id?: string
          museum_id?: string
          object_id?: string | null
          page_type?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      reproduction_requests: {
        Row: {
          created_at: string
          credit_line: string | null
          decision_by: string | null
          decision_date: string | null
          fee: number | null
          fee_currency: string | null
          id: string
          image_file_reference: string | null
          licence_terms: string | null
          museum_id: string
          notes: string | null
          object_id: string
          purpose: string | null
          reproduced_by: string | null
          reproduction_date: string | null
          reproduction_type: string | null
          request_date: string
          requester_name: string
          requester_org: string | null
          rights_clearance_confirmed: boolean | null
          status: string
        }
        Insert: {
          created_at?: string
          credit_line?: string | null
          decision_by?: string | null
          decision_date?: string | null
          fee?: number | null
          fee_currency?: string | null
          id?: string
          image_file_reference?: string | null
          licence_terms?: string | null
          museum_id: string
          notes?: string | null
          object_id: string
          purpose?: string | null
          reproduced_by?: string | null
          reproduction_date?: string | null
          reproduction_type?: string | null
          request_date: string
          requester_name: string
          requester_org?: string | null
          rights_clearance_confirmed?: boolean | null
          status?: string
        }
        Update: {
          created_at?: string
          credit_line?: string | null
          decision_by?: string | null
          decision_date?: string | null
          fee?: number | null
          fee_currency?: string | null
          id?: string
          image_file_reference?: string | null
          licence_terms?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string
          purpose?: string | null
          reproduced_by?: string | null
          reproduction_date?: string | null
          reproduction_type?: string | null
          request_date?: string
          requester_name?: string
          requester_org?: string | null
          rights_clearance_confirmed?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reproduction_requests_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reproduction_requests_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      rights_records: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          licence_terms: string | null
          museum_id: string
          notes: string | null
          object_id: string | null
          restrictions: string | null
          rights_holder: string | null
          rights_in: string | null
          rights_out: string | null
          rights_reference: string
          rights_status: string
          rights_type: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          licence_terms?: string | null
          museum_id: string
          notes?: string | null
          object_id?: string | null
          restrictions?: string | null
          rights_holder?: string | null
          rights_in?: string | null
          rights_out?: string | null
          rights_reference: string
          rights_status: string
          rights_type: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          licence_terms?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string | null
          restrictions?: string | null
          rights_holder?: string | null
          rights_in?: string | null
          rights_out?: string | null
          rights_reference?: string
          rights_status?: string
          rights_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rights_records_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rights_records_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_register: {
        Row: {
          created_at: string
          description: string
          id: string
          likelihood: string
          mitigation: string | null
          museum_id: string
          notes: string | null
          object_id: string | null
          responsible_person: string | null
          review_date: string | null
          risk_type: string
          severity: string
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          likelihood?: string
          mitigation?: string | null
          museum_id: string
          notes?: string | null
          object_id?: string | null
          responsible_person?: string | null
          review_date?: string | null
          risk_type: string
          severity?: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          likelihood?: string
          mitigation?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string | null
          responsible_person?: string | null
          review_date?: string | null
          risk_type?: string
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_register_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_register_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          access_level: string | null
          created_at: string | null
          department: string | null
          email: string | null
          id: string
          museum_id: string | null
          name: string
          role: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          id?: string
          museum_id?: string | null
          name: string
          role?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          id?: string
          museum_id?: string | null
          name?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          access: string
          created_at: string | null
          department: string
          email: string
          id: string
          invited_at: string | null
          museum_id: string
          name: string
          role: string
          user_id: string | null
        }
        Insert: {
          access?: string
          created_at?: string | null
          department?: string
          email: string
          id?: string
          invited_at?: string | null
          museum_id: string
          name: string
          role: string
          user_id?: string | null
        }
        Update: {
          access?: string
          created_at?: string | null
          department?: string
          email?: string
          id?: string
          invited_at?: string | null
          museum_id?: string
          name?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          amount_cents: number
          buyer_email: string
          buyer_name: string
          created_at: string
          currency: string
          event_id: string
          id: string
          museum_id: string
          platform_fee_cents: number
          quantity: number
          slot_id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents?: number
          buyer_email: string
          buyer_name: string
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          museum_id: string
          platform_fee_cents?: number
          quantity?: number
          slot_id: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_email?: string
          buyer_name?: string
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          museum_id?: string
          platform_fee_cents?: number
          quantity?: number
          slot_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "event_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          order_id: string
          status: string
          ticket_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          status?: string
          ticket_code: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          status?: string
          ticket_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      valuations: {
        Row: {
          created_at: string
          currency: string
          id: string
          method: string | null
          museum_id: string
          notes: string | null
          object_id: string
          purpose: string | null
          validity_date: string | null
          valuation_basis: string | null
          valuation_date: string
          valuation_reference: string | null
          value: number
          valuer: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          museum_id: string
          notes?: string | null
          object_id: string
          purpose?: string | null
          validity_date?: string | null
          valuation_basis?: string | null
          valuation_date: string
          valuation_reference?: string | null
          value: number
          valuer?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          museum_id?: string
          notes?: string | null
          object_id?: string
          purpose?: string | null
          validity_date?: string | null
          valuation_basis?: string | null
          valuation_date?: string
          valuation_reference?: string | null
          value?: number
          valuer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuations_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuations_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      wanted_items: {
        Row: {
          acquired_at: string | null
          converted_object_id: string | null
          created_at: string
          id: string
          medium: string | null
          museum_id: string
          notes: string | null
          priority: string
          title: string
          year: string | null
        }
        Insert: {
          acquired_at?: string | null
          converted_object_id?: string | null
          created_at?: string
          id?: string
          medium?: string | null
          museum_id: string
          notes?: string | null
          priority?: string
          title: string
          year?: string | null
        }
        Update: {
          acquired_at?: string | null
          converted_object_id?: string | null
          created_at?: string
          id?: string
          medium?: string | null
          museum_id?: string
          notes?: string | null
          priority?: string
          title?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wanted_items_converted_object_id_fkey"
            columns: ["converted_object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wanted_items_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_slot_bookings: {
        Args: { qty: number; slot_uuid: string }
        Returns: boolean
      }
      insert_document_if_quota_ok: {
        Args: {
          p_document_type: string
          p_file_name: string
          p_file_size: number
          p_file_url: string
          p_label: string
          p_limit_bytes: number
          p_mime_type: string
          p_museum_id: string
          p_object_id: string
          p_related_to_id: string
          p_related_to_type: string
          p_uploaded_by: string
        }
        Returns: {
          created_at: string
          deleted_at: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          label: string
          mime_type: string | null
          museum_id: string
          notes: string | null
          object_id: string
          related_to_id: string | null
          related_to_type: string
          uploaded_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "object_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_staff_of_museum: { Args: { museum_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
