"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, MapPin, Video, Users } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import type { Skill, User, UserSkill } from "@/lib/types"

interface SkillWithTeacher extends UserSkill {
  skill: Skill
  user: User
}

function SkillsContent() {
  const [skills, setSkills] = useState<SkillWithTeacher[]>([])
  const [filteredSkills, setFilteredSkills] = useState<SkillWithTeacher[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCollege, setSelectedCollege] = useState("all")
  const [selectedMode, setSelectedMode] = useState("all")
  const [loading, setLoading] = useState(true)

  const categories = ["Programming", "Design", "Languages", "Music", "Sports", "Academic", "Other"]
  const colleges = ["MIT", "Stanford University", "Harvard University", "UC Berkeley", "Carnegie Mellon", "Other"]
  const modes = ["virtual", "in-person"]

  useEffect(() => {
    fetchSkills()
  }, [])

  useEffect(() => {
    filterSkills()
  }, [skills, searchTerm, selectedCategory, selectedCollege, selectedMode])

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("user_skills")
        .select(`
          *,
          skill:skills(*),
          user:users(*)
        `)
        .eq("type", "offered")

      if (error) {
        console.error("Error fetching skills:", error)
        return
      }

      if (data) {
        setSkills(data as SkillWithTeacher[])
      }
    } catch (error) {
      console.error("Error fetching skills:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSkills = () => {
    let filtered = skills

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (skill) =>
          skill.skill?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          skill.skill?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          skill.user?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((skill) => skill.skill?.category === selectedCategory)
    }

    // College filter
    if (selectedCollege !== "all") {
      filtered = filtered.filter((skill) => skill.user?.college === selectedCollege)
    }

    // Mode filter (this would need to be added to the database schema)
    // For now, we'll randomly assign modes for demo purposes
    if (selectedMode !== "all") {
      // This is a placeholder - in a real app, you'd store preferred modes in the database
    }

    setFilteredSkills(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Skills</h1>
          <p className="text-gray-600">Discover skills offered by your campus community</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search skills or instructors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* College Filter */}
              <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                <SelectTrigger>
                  <SelectValue placeholder="College" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map((college) => (
                    <SelectItem key={college} value={college}>
                      {college}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mode Filter */}
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredSkills.length} skill{filteredSkills.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Skills Grid */}
        {filteredSkills.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skillItem) => (
              <Card key={skillItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{skillItem.skill?.name}</CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={skillItem.user?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{skillItem.user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{skillItem.user?.name}</p>
                          <p className="text-xs text-gray-500">{skillItem.user?.college}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{skillItem.skill?.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {skillItem.skill?.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>Level {skillItem.proficiency_level}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Math.random() > 0.5 ? (
                          <>
                            <Video className="w-4 h-4" />
                            <span>Virtual</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>In-Person</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-600">
                      {Math.floor(Math.random() * 20) + 10} credits/hour
                    </div>
                    <Link href={`/meetups/schedule?skill=${skillItem.skill?.id}&teacher=${skillItem.user?.id}`}>
                      <Button size="sm">Book Session</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No skills found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or browse all skills</p>
            <Button
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedCollege("all")
                setSelectedMode("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SkillsPage() {
  return (
    <AuthGuard>
      <SkillsContent />
    </AuthGuard>
  )
}
