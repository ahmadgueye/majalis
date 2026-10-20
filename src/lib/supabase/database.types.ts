
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "board_elements": {
                  Row: {
                    "data": NonNullable<Json>,"id": string,"session_id": string,"space_id": string,"type": string,"updated_at": string,"updated_by": string | null,"z": number
                  }
                  ComputedFields: never
                  Insert: {
                    "data"?: NonNullable<Json>,"id"?: string,"session_id": string,"space_id": string,"type": string,"updated_at"?: string,"updated_by"?: string | null,"z"?: number
                  }
                  Update: {
                    "data"?: NonNullable<Json>,"id"?: string,"session_id"?: string,"space_id"?: string,"type"?: string,"updated_at"?: string,"updated_by"?: string | null,"z"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "board_elements_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "board_elements_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "anchor": Json | null,"author_id": string,"body": string,"created_at": string,"id": string,"parent_id": string | null,"resolved": boolean,"session_id": string | null,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "anchor"?: Json | null,"author_id"?: string,"body": string,"created_at"?: string,"id"?: string,"parent_id"?: string | null,"resolved"?: boolean,"session_id"?: string | null,"space_id": string
                  }
                  Update: {
                    "anchor"?: Json | null,"author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"parent_id"?: string | null,"resolved"?: boolean,"session_id"?: string | null,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"highlights": {
                  Row: {
                    "kind": string,"ref": string,"session_id": string,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "kind": string,"ref": string,"session_id": string,"space_id": string
                  }
                  Update: {
                    "kind"?: string,"ref"?: string,"session_id"?: string,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "highlights_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "highlights_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"mentions": {
                  Row: {
                    "comment_id": string,"read_at": string | null,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id": string,"read_at"?: string | null,"space_id": string,"user_id": string
                  }
                  Update: {
                    "comment_id"?: string,"read_at"?: string | null,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mentions_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mentions_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "color": string,"created_at": string,"display_name": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"display_name"?: string,"id": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"display_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"sessions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"space_id": string,"surah": number,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"space_id": string,"surah"?: number,"title"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"space_id"?: string,"surah"?: number,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sessions_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"space_invites": {
                  Row: {
                    "created_by": string,"expires_at": string,"role": string,"space_id": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_by"?: string,"expires_at"?: string,"role"?: string,"space_id": string,"token"?: string
                  }
                  Update: {
                    "created_by"?: string,"expires_at"?: string,"role"?: string,"space_id"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_invites_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"space_members": {
                  Row: {
                    "joined_at": string,"role": string,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"role"?: string,"space_id": string,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"role"?: string,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_members_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"spaces": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"owner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"owner_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"owner_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wbw_translations": {
                  Row: {
                    "free": string,"joins": (number)[],"ref": string,"space_id": string,"updated_at": string,"updated_by": string | null,"words": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "free"?: string,"joins"?: (number)[],"ref": string,"space_id": string,"updated_at"?: string,"updated_by"?: string | null,"words"?: NonNullable<Json>
                  }
                  Update: {
                    "free"?: string,"joins"?: (number)[],"ref"?: string,"space_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"words"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "wbw_translations_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invite":
{ Args: { "invite_token": string }; Returns: string
                           },
"can_edit":
{ Args: { "sid": string }; Returns: boolean
                           },
"is_member":
{ Args: { "sid": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
