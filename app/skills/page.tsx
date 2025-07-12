"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, BookOpen, MapPin, Video, Star, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { UserSkill, User } from "@/lib/types"

interface SkillWithUser extends UserSkill {
  user: User
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillWithUser[]>([])
  const [filteredSkills, setFilteredSkills] = useState<SkillWithUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCollege, setSelectedCollege] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedMode, setSelectedMode] = useState("")
  const [loading, setLoading] = useState(true)
  const [colleges, setColleges] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchSkills()
  }, [])

  useEffect(() => {
    filterSkills()
  }, [skills, searchTerm, selectedCollege, selectedCategory, selectedMode])

  const fetchSkills = async () => {
    try {
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select(`
          *,
          skill:skills(*),
          user:users(*)
        `)
        .eq("type", "offered")

      if (skillsData) {
        const skillsWithUsers = skillsData.filter((skill) => skill.user && skill.skill) as SkillWithUser[]
        setSkills(skillsWithUsers)

        // Extract unique colleges and categories
        const uniqueColleges = [...new Set(skillsWithUsers.map((s) => s.user.college))]
        const uniqueCategories = [...new Set(skillsWithUsers.map((s) => s.skill.category))]

        setColleges(uniqueColleges)
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error("Error fetching skills:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSkills = () => {
    let filtered = skills

    if (searchTerm) {
      filtered = filtered.filter(
        (skill) =>
          skill.skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          skill.skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          skill.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCollege) {
      filtered = filtered.filter((skill) => skill.user.college === selectedCollege)
    }

    if (selectedCategory) {
      filtered = filtered.filter((skill) => skill.skill.category === selectedCategory)
    }

    setFilteredSkills(filtered)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCollege("")
    setSelectedCategory("")
    setSelectedMode("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SkillSwap Campus
              </span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skill Directory</h1>
          <p className="text-gray-600">Discover skills you can learn from fellow students and instructors</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search & Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search skills or instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                <SelectTrigger>
                  <SelectValue placeholder="All Colleges" />
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

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
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

              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredSkills.length} of {skills.length} skills
              </p>
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skillItem) => (
            <Card key={skillItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={skillItem.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{skillItem.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{skillItem.user.name}</h3>
                      <p className="text-sm text-gray-600">{skillItem.user.college}</p>
                      <Badge variant="secondary" className="text-xs">
                        {skillItem.user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{skillItem.proficiency_level || 3}/5</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-lg">{skillItem.skill.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {skillItem.skill.category}
                    </Badge>
                  </div>

                  {skillItem.skill.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{skillItem.skill.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Video className="w-4 h-4" />
                        <span>Virtual</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>In-Person</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      20-30 credits
                    </Badge>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Link
                      href={`/meetups/schedule?teacher=${skillItem.user.id}&skill=${skillItem.skill.id}`}
                      className="flex-1"
                    >
                      <Button className="w-full" size="sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Book Session
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSkills.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No skills found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or browse all available skills</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  )
}
